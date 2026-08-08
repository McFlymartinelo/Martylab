import type {
  PortainerContainerSummary,
  PortainerImageSummary,
  PortainerOverviewResponse,
  PortainerStatusResponse,
  PortainerVolumeSummary,
} from "@martylab/shared";
import { fetchJson } from "../../lib/http-client.js";

export interface PortainerClientConfig {
  baseUrl?: string | undefined;
  apiToken?: string | undefined;
  endpointId?: number | undefined;
  timeoutMs?: number | undefined;
  allowInsecureTls?: boolean | undefined;
}

interface PortainerStatusPayload {
  Version?: string;
}

interface PortainerEndpointRow {
  Id: number;
  Name: string;
  Type?: number;
}

interface PortainerContainerRow {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
}

interface PortainerImageRow {
  Id: string;
  RepoTags: string[] | null;
  Size: number;
  Created: number;
}

interface PortainerVolumesPayload {
  Volumes?: Array<{
    Name: string;
    Driver: string;
    Mountpoint: string;
  }> | null;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function createPortainerClient(config: PortainerClientConfig) {
  const baseUrl = config.baseUrl ? normalizeBaseUrl(config.baseUrl) : undefined;
  const timeoutMs = config.timeoutMs ?? 6_000;
  const allowInsecureTls = config.allowInsecureTls ?? false;

  async function request<T>(path: string, method: "GET" | "POST" = "GET"): Promise<T> {
    if (!baseUrl || !config.apiToken) {
      throw new Error("Portainer is not configured.");
    }

    return fetchJson<T>(`${baseUrl}${path}`, {
      method,
      timeoutMs,
      allowInsecureTls,
      headers: {
        "X-API-Key": config.apiToken,
      },
    });
  }

  async function resolveEndpointId(): Promise<number | null> {
    if (config.endpointId) {
      return config.endpointId;
    }

    const endpoints = await request<PortainerEndpointRow[]>("/api/endpoints");
    const local =
      endpoints.find((endpoint) => endpoint.Name.toLowerCase().includes("local")) ??
      endpoints[0];

    return local?.Id ?? null;
  }

  return {
    isConfigured: Boolean(baseUrl && config.apiToken),

    async checkStatus(): Promise<PortainerStatusResponse> {
      if (!baseUrl || !config.apiToken) {
        return {
          configured: false,
          online: false,
          version: null,
          endpointId: null,
          endpointName: null,
        };
      }

      try {
        const [status, endpoints] = await Promise.all([
          request<PortainerStatusPayload>("/api/status"),
          request<PortainerEndpointRow[]>("/api/endpoints"),
        ]);

        const endpointId = config.endpointId ?? endpoints[0]?.Id ?? null;
        const endpointName =
          endpoints.find((endpoint) => endpoint.Id === endpointId)?.Name ?? null;

        return {
          configured: true,
          online: true,
          version: status.Version ?? null,
          endpointId,
          endpointName,
        };
      } catch {
        return {
          configured: true,
          online: false,
          version: null,
          endpointId: config.endpointId ?? null,
          endpointName: null,
        };
      }
    },

    async getOverview(): Promise<PortainerOverviewResponse> {
      const empty: PortainerOverviewResponse = {
        available: false,
        containers: [],
        images: [],
        volumes: [],
      };

      if (!baseUrl || !config.apiToken) {
        return empty;
      }

      try {
        const endpointId = await resolveEndpointId();
        if (!endpointId) {
          return empty;
        }

        const [containers, images, volumes] = await Promise.all([
          request<PortainerContainerRow[]>(
            `/api/endpoints/${endpointId}/docker/containers/json?all=1`,
          ),
          request<PortainerImageRow[]>(
            `/api/endpoints/${endpointId}/docker/images/json`,
          ),
          request<PortainerVolumesPayload>(
            `/api/endpoints/${endpointId}/docker/volumes`,
          ),
        ]);

        const containerSummaries: PortainerContainerSummary[] = containers.map(
          (row) => ({
            id: row.Id.slice(0, 12),
            name: (row.Names[0] ?? "unknown").replace(/^\//, ""),
            image: row.Image,
            state: row.State,
            status: row.Status,
          }),
        );

        const imageSummaries: PortainerImageSummary[] = images.map((row) => ({
          id: row.Id.replace("sha256:", "").slice(0, 12),
          tags: row.RepoTags ?? ["<none>"],
          sizeBytes: row.Size,
          createdAt: row.Created
            ? new Date(row.Created * 1000).toISOString()
            : null,
        }));

        const volumeSummaries: PortainerVolumeSummary[] = (
          volumes.Volumes ?? []
        ).map((row) => ({
          name: row.Name,
          driver: row.Driver,
          mountpoint: row.Mountpoint,
        }));

        return {
          available: true,
          containers: containerSummaries,
          images: imageSummaries,
          volumes: volumeSummaries,
        };
      } catch {
        return empty;
      }
    },

    async containerAction(
      containerId: string,
      action: "start" | "stop" | "restart",
    ): Promise<void> {
      const endpointId = await resolveEndpointId();
      if (!endpointId) {
        throw new Error("No Portainer endpoint available.");
      }

      await request(
        `/api/endpoints/${endpointId}/docker/containers/${containerId}/${action}`,
        "POST",
      );
    },
  };
}

export type PortainerClient = ReturnType<typeof createPortainerClient>;
