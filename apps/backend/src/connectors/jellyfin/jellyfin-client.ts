import type {
  JellyfinLibrary,
  JellyfinMediaItem,
  JellyfinPageResponse,
  JellyfinPlaybackSession,
  JellyfinServerInfo,
  JellyfinStatusResponse,
  JellyfinSummaryResponse,
} from "@martylab/shared";

export interface JellyfinClientConfig {
  baseUrl?: string | undefined;
  publicUrl?: string | undefined;
  apiKey?: string | undefined;
  userId?: string | undefined;
  timeoutMs?: number | undefined;
}

interface JellyfinPublicInfo {
  ServerName?: string;
  Version?: string;
}

interface JellyfinSystemInfo extends JellyfinPublicInfo {
  OperatingSystem?: string;
}

interface JellyfinUser {
  Id: string;
  Name: string;
}

interface JellyfinImageTags {
  Primary?: string;
}

interface JellyfinUserData {
  PlayedPercentage?: number;
}

interface JellyfinBaseItem {
  Id: string;
  Name: string;
  Type: string;
  ProductionYear?: number;
  Overview?: string;
  ImageTags?: JellyfinImageTags;
  UserData?: JellyfinUserData;
  SeriesName?: string;
  ParentIndexNumber?: number;
  IndexNumber?: number;
  ChildCount?: number;
  RunTimeTicks?: number;
}

interface JellyfinQueryResult<T> {
  Items?: T[];
  TotalRecordCount?: number;
}

interface JellyfinSessionNowPlaying {
  Name?: string;
  Type?: string;
  RunTimeTicks?: number;
}

interface JellyfinPlayState {
  IsPaused?: boolean;
  PositionTicks?: number;
}

interface JellyfinSession {
  Id: string;
  UserName?: string;
  Client?: string;
  NowPlayingItem?: JellyfinSessionNowPlaying;
  PlayState?: JellyfinPlayState;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function formatSeasonEpisode(item: JellyfinBaseItem): string | null {
  if (
    item.ParentIndexNumber !== undefined &&
    item.IndexNumber !== undefined
  ) {
    return `S${item.ParentIndexNumber}E${item.IndexNumber}`;
  }

  return null;
}

function mapMediaItem(item: JellyfinBaseItem): JellyfinMediaItem {
  return {
    id: item.Id,
    name: item.Name,
    type: item.Type,
    year: item.ProductionYear ?? null,
    overview: item.Overview ?? null,
    imageUrl: `/api/jellyfin/items/${item.Id}/image`,
    playedPercent:
      typeof item.UserData?.PlayedPercentage === "number"
        ? item.UserData.PlayedPercentage
        : null,
    seriesName: item.SeriesName ?? null,
    seasonEpisode: formatSeasonEpisode(item),
  };
}

function mapLibrary(item: JellyfinBaseItem): JellyfinLibrary {
  return {
    id: item.Id,
    name: item.Name,
    type: item.Type,
    itemCount:
      typeof item.ChildCount === "number" ? item.ChildCount : null,
  };
}

function mapSession(session: JellyfinSession): JellyfinPlaybackSession {
  return {
    id: session.Id,
    userName: session.UserName ?? "Utilisateur",
    client: session.Client ?? "Client inconnu",
    isPaused: session.PlayState?.IsPaused ?? false,
    itemName: session.NowPlayingItem?.Name ?? null,
    itemType: session.NowPlayingItem?.Type ?? null,
    positionTicks: session.PlayState?.PositionTicks ?? null,
    durationTicks: session.NowPlayingItem?.RunTimeTicks ?? null,
  };
}

export function createJellyfinClient(config: JellyfinClientConfig) {
  const baseUrl = config.baseUrl ? normalizeBaseUrl(config.baseUrl) : undefined;
  const publicUrl = config.publicUrl
    ? normalizeBaseUrl(config.publicUrl)
    : baseUrl;
  const timeoutMs = config.timeoutMs ?? 6_000;
  let cachedUserId: string | null = config.userId ?? null;

  function buildHeaders(accept = "application/json"): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: accept,
    };

    if (config.apiKey) {
      headers.Authorization = `MediaBrowser Token="${config.apiKey}"`;
    }

    return headers;
  }

  async function request<T>(
    path: string,
    options: {
      method?: "GET";
      accept?: string;
      authenticated?: boolean;
    } = {},
  ): Promise<T> {
    if (!baseUrl) {
      throw new Error("Jellyfin URL is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers:
          options.authenticated === false
            ? { Accept: options.accept ?? "application/json" }
            : buildHeaders(options.accept),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Jellyfin API error ${response.status}${text ? `: ${text}` : ""}`,
        );
      }

      if ((options.accept ?? "application/json").startsWith("application/json")) {
        return (await response.json()) as T;
      }

      return response as unknown as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function resolveUserId(): Promise<string> {
    if (cachedUserId) {
      return cachedUserId;
    }

    const user = await request<JellyfinUser>("/Users/Me");
    cachedUserId = user.Id;
    return user.Id;
  }

  async function fetchSystemInfo(): Promise<JellyfinSystemInfo | null> {
    if (!baseUrl || !config.apiKey) {
      return null;
    }

    try {
      return await request<JellyfinSystemInfo>("/System/Info");
    } catch {
      return null;
    }
  }

  async function fetchPageData(userId: string) {
    const [views, resume, latest, movies, series, sessions, systemInfo] =
      await Promise.all([
        request<JellyfinQueryResult<JellyfinBaseItem>>(
          `/UserViews?userId=${userId}`,
        ),
        request<JellyfinQueryResult<JellyfinBaseItem>>(
          `/UserItems/Resume?userId=${userId}&Limit=12&Fields=Overview`,
        ),
        request<JellyfinBaseItem[]>(
          `/UserItems/Latest?userId=${userId}&Limit=12&Fields=Overview`,
        ),
        request<JellyfinQueryResult<JellyfinBaseItem>>(
          `/Items?userId=${userId}&IncludeItemTypes=Movie&Recursive=true&SortBy=DateCreated&SortOrder=Descending&Limit=20&Fields=Overview`,
        ),
        request<JellyfinQueryResult<JellyfinBaseItem>>(
          `/Items?userId=${userId}&IncludeItemTypes=Series&Recursive=true&SortBy=SortName&SortOrder=Ascending&Limit=20&Fields=Overview`,
        ),
        request<JellyfinSession[]>("/Sessions"),
        fetchSystemInfo(),
      ]);

    const activeSessions = sessions.filter(
      (session) => session.NowPlayingItem !== undefined,
    );

    const server: JellyfinServerInfo | null = systemInfo
      ? {
          serverName: systemInfo.ServerName ?? "Jellyfin",
          version: systemInfo.Version ?? "—",
          operatingSystem: systemInfo.OperatingSystem ?? null,
          activeSessions: activeSessions.length,
        }
      : null;

    return {
      libraries: (views.Items ?? []).map(mapLibrary),
      resumeItems: (resume.Items ?? []).map(mapMediaItem),
      latestItems: latest.map(mapMediaItem),
      movies: (movies.Items ?? []).map(mapMediaItem),
      series: (series.Items ?? []).map(mapMediaItem),
      sessions: activeSessions.map(mapSession),
      server,
      resumeTotal: resume.TotalRecordCount ?? resume.Items?.length ?? 0,
      latestTotal: latest.length,
    };
  }

  return {
    isConfigured: Boolean(baseUrl && config.apiKey),
    publicUrl: publicUrl ?? null,

    async checkHealth(): Promise<JellyfinStatusResponse> {
      if (!baseUrl) {
        return {
          configured: false,
          online: false,
          serverName: null,
          version: null,
          jellyfinUrl: publicUrl ?? null,
        };
      }

      try {
        const publicInfo = await request<JellyfinPublicInfo>(
          "/System/Info/Public",
          { authenticated: false },
        );

        if (!config.apiKey) {
          return {
            configured: false,
            online: true,
            serverName: publicInfo.ServerName ?? null,
            version: publicInfo.Version ?? null,
            jellyfinUrl: publicUrl ?? null,
          };
        }

        const systemInfo = await fetchSystemInfo();

        return {
          configured: true,
          online: systemInfo !== null,
          serverName:
            systemInfo?.ServerName ?? publicInfo.ServerName ?? null,
          version: systemInfo?.Version ?? publicInfo.Version ?? null,
          jellyfinUrl: publicUrl ?? null,
        };
      } catch {
        return {
          configured: Boolean(config.apiKey),
          online: false,
          serverName: null,
          version: null,
          jellyfinUrl: publicUrl ?? null,
        };
      }
    },

    async getSummary(): Promise<JellyfinSummaryResponse> {
      const empty: JellyfinSummaryResponse = {
        available: false,
        jellyfinUrl: publicUrl ?? null,
        serverName: null,
        version: null,
        activeSessions: 0,
        resumeCount: 0,
        latestCount: 0,
        resumeItems: [],
        latestItems: [],
      };

      if (!baseUrl || !config.apiKey) {
        return empty;
      }

      try {
        const userId = await resolveUserId();
        const data = await fetchPageData(userId);

        return {
          available: true,
          jellyfinUrl: publicUrl ?? null,
          serverName: data.server?.serverName ?? null,
          version: data.server?.version ?? null,
          activeSessions: data.server?.activeSessions ?? 0,
          resumeCount: data.resumeTotal,
          latestCount: data.latestTotal,
          resumeItems: data.resumeItems.slice(0, 4),
          latestItems: data.latestItems.slice(0, 4),
        };
      } catch {
        return empty;
      }
    },

    async getPage(): Promise<JellyfinPageResponse> {
      const empty: JellyfinPageResponse = {
        available: false,
        jellyfinUrl: publicUrl ?? null,
        server: null,
        libraries: [],
        resumeItems: [],
        latestItems: [],
        movies: [],
        series: [],
        sessions: [],
      };

      if (!baseUrl || !config.apiKey) {
        return empty;
      }

      try {
        const userId = await resolveUserId();
        const data = await fetchPageData(userId);

        return {
          available: true,
          jellyfinUrl: publicUrl ?? null,
          server: data.server,
          libraries: data.libraries,
          resumeItems: data.resumeItems,
          latestItems: data.latestItems,
          movies: data.movies,
          series: data.series,
          sessions: data.sessions,
        };
      } catch {
        return empty;
      }
    },

    async getItemImage(itemId: string): Promise<{
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
          `${baseUrl}/Items/${encodeURIComponent(itemId)}/Images/Primary`,
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

export type JellyfinClient = ReturnType<typeof createJellyfinClient>;
