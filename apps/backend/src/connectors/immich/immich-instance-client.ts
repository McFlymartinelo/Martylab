import type {
  ImmichAlbumSummary,
  ImmichAssetStats,
  ImmichInstanceId,
  ImmichInstanceStatus,
  ImmichInstanceSummary,
} from "@martylab/shared";

export interface ImmichInstanceClientConfig {
  id: ImmichInstanceId;
  label: string;
  baseUrl?: string | undefined;
  publicUrl?: string | undefined;
  apiKey?: string | undefined;
  timeoutMs?: number | undefined;
}

interface ImmichVersionInfo {
  major: number;
  minor: number;
  patch: number;
}

interface ImmichAssetStatsResponse {
  images: number;
  videos: number;
  total: number;
}

interface ImmichAlbumStatsResponse {
  owned: number;
  shared: number;
  notShared: number;
}

interface ImmichAlbumResponse {
  id: string;
  albumName: string;
  assetCount: number;
  albumThumbnailAssetId?: string | null;
  shared: boolean;
  createdAt?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function formatVersion(version: ImmichVersionInfo | null): string | null {
  if (!version) {
    return null;
  }

  return `${version.major}.${version.minor}.${version.patch}`;
}

function mapAlbum(
  album: ImmichAlbumResponse,
  instanceId: ImmichInstanceId,
): ImmichAlbumSummary {
  return {
    id: album.id,
    name: album.albumName,
    assetCount: album.assetCount,
    thumbnailUrl: album.albumThumbnailAssetId
      ? `/api/immich/${instanceId}/assets/${album.albumThumbnailAssetId}/thumbnail`
      : null,
    shared: album.shared,
    createdAt: album.createdAt ?? null,
  };
}

export function createImmichInstanceClient(config: ImmichInstanceClientConfig) {
  const baseUrl = config.baseUrl ? normalizeBaseUrl(config.baseUrl) : undefined;
  const publicUrl = config.publicUrl
    ? normalizeBaseUrl(config.publicUrl)
    : baseUrl;
  const timeoutMs = config.timeoutMs ?? 6_000;
  const apiPrefix = "/api";

  function buildHeaders(accept = "application/json"): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: accept,
    };

    if (config.apiKey) {
      headers["x-api-key"] = config.apiKey;
    }

    return headers;
  }

  async function request<T>(
    path: string,
    options: {
      authenticated?: boolean;
      accept?: string;
      responseType?: "json" | "text";
    } = {},
  ): Promise<T> {
    if (!baseUrl) {
      throw new Error(`Immich URL is not configured for ${config.id}.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const accept = options.accept ?? "application/json";
    const responseType =
      options.responseType ??
      (accept.startsWith("application/json") ? "json" : "text");

    try {
      const response = await fetch(`${baseUrl}${apiPrefix}${path}`, {
        method: "GET",
        headers:
          options.authenticated === false
            ? { Accept: accept }
            : buildHeaders(accept),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Immich API error ${response.status}${text ? `: ${text}` : ""}`,
        );
      }

      if (responseType === "json") {
        return (await response.json()) as T;
      }

      return (await response.text()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchVersion(): Promise<string | null> {
    try {
      const version = await request<ImmichVersionInfo>("/server/version");
      return formatVersion(version);
    } catch {
      return null;
    }
  }

  async function fetchInstanceData(albumLimit: number) {
    const [stats, albumStats, albums] = await Promise.all([
      request<ImmichAssetStatsResponse>("/assets/statistics"),
      request<ImmichAlbumStatsResponse>("/albums/statistics"),
      request<ImmichAlbumResponse[]>("/albums"),
    ]);

    const sortedAlbums = [...albums].sort((left, right) => {
      const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
      const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
      return rightTime - leftTime;
    });

    return {
      stats: {
        images: stats.images,
        videos: stats.videos,
        total: stats.total,
      } satisfies ImmichAssetStats,
      albumCount: albumStats.owned + albumStats.shared,
      sharedAlbumCount: albumStats.shared,
      albums: sortedAlbums
        .slice(0, albumLimit)
        .map((album) => mapAlbum(album, config.id)),
    };
  }

  return {
    id: config.id,
    label: config.label,
    isConfigured: Boolean(baseUrl && config.apiKey),
    publicUrl: publicUrl ?? null,

    async checkHealth(): Promise<ImmichInstanceStatus> {
      if (!baseUrl) {
        return {
          id: config.id,
          label: config.label,
          configured: false,
          online: false,
          version: null,
          immichUrl: publicUrl ?? null,
        };
      }

      try {
        const ping = await request<string>("/server/ping", {
          authenticated: false,
          accept: "text/plain",
          responseType: "text",
        });

        if (ping.trim().toLowerCase() !== "pong") {
          throw new Error("Unexpected Immich ping response.");
        }

        if (!config.apiKey) {
          return {
            id: config.id,
            label: config.label,
            configured: false,
            online: true,
            version: await fetchVersion(),
            immichUrl: publicUrl ?? null,
          };
        }

        const version = await fetchVersion();

        return {
          id: config.id,
          label: config.label,
          configured: true,
          online: version !== null,
          version,
          immichUrl: publicUrl ?? null,
        };
      } catch {
        return {
          id: config.id,
          label: config.label,
          configured: Boolean(config.apiKey),
          online: false,
          version: null,
          immichUrl: publicUrl ?? null,
        };
      }
    },

    async getSummary(): Promise<ImmichInstanceSummary> {
      const empty: ImmichInstanceSummary = {
        id: config.id,
        label: config.label,
        available: false,
        immichUrl: publicUrl ?? null,
        version: null,
        stats: null,
        albumCount: 0,
        sharedAlbumCount: 0,
        albums: [],
      };

      if (!baseUrl || !config.apiKey) {
        return empty;
      }

      try {
        const [version, data] = await Promise.all([
          fetchVersion(),
          fetchInstanceData(4),
        ]);

        return {
          id: config.id,
          label: config.label,
          available: true,
          immichUrl: publicUrl ?? null,
          version,
          stats: data.stats,
          albumCount: data.albumCount,
          sharedAlbumCount: data.sharedAlbumCount,
          albums: data.albums,
        };
      } catch {
        return empty;
      }
    },

    async getPage(): Promise<ImmichInstanceSummary> {
      const empty: ImmichInstanceSummary = {
        id: config.id,
        label: config.label,
        available: false,
        immichUrl: publicUrl ?? null,
        version: null,
        stats: null,
        albumCount: 0,
        sharedAlbumCount: 0,
        albums: [],
      };

      if (!baseUrl || !config.apiKey) {
        return empty;
      }

      try {
        const [version, data] = await Promise.all([
          fetchVersion(),
          fetchInstanceData(24),
        ]);

        return {
          id: config.id,
          label: config.label,
          available: true,
          immichUrl: publicUrl ?? null,
          version,
          stats: data.stats,
          albumCount: data.albumCount,
          sharedAlbumCount: data.sharedAlbumCount,
          albums: data.albums,
        };
      } catch {
        return empty;
      }
    },

    async getAssetThumbnail(assetId: string): Promise<{
      body: Buffer;
      contentType: string;
    } | null> {
      if (!baseUrl || !config.apiKey) {
        return null;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(
          `${baseUrl}${apiPrefix}/assets/${encodeURIComponent(assetId)}/thumbnail?size=thumbnail`,
          {
            headers: buildHeaders("image/*"),
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const contentType =
          response.headers.get("content-type") ?? "image/jpeg";

        return {
          body: Buffer.from(arrayBuffer),
          contentType,
        };
      } catch {
        return null;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export type ImmichInstanceClient = ReturnType<
  typeof createImmichInstanceClient
>;
