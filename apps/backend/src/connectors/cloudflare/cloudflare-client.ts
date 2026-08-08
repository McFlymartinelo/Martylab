import type { CloudflareStatusResponse } from "@martylab/shared";
import { fetchJson } from "../../lib/http-client.js";

export interface CloudflareClientConfig {
  apiToken?: string | undefined;
  accountId?: string | undefined;
  tunnelId?: string | undefined;
  hostnames?: string[] | undefined;
  timeoutMs?: number | undefined;
}

interface CloudflareApiResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ message: string }>;
}

interface CloudflareTunnelResult {
  id: string;
  name: string;
  status: string;
  connections?: Array<{ colo_name: string }>;
}

function parseHostnames(raw: string[] | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .map((hostname) => hostname.trim())
    .filter((hostname) => hostname.length > 0);
}

export function createCloudflareClient(config: CloudflareClientConfig) {
  const timeoutMs = config.timeoutMs ?? 6_000;
  const hostnames = parseHostnames(config.hostnames);

  async function cloudflareRequest<T>(path: string): Promise<T> {
    if (!config.apiToken) {
      throw new Error("Cloudflare API token is not configured.");
    }

    const payload = await fetchJson<CloudflareApiResponse<T>>(
      `https://api.cloudflare.com/client/v4${path}`,
      {
        timeoutMs,
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
        },
      },
    );

    if (!payload.success) {
      const message =
        payload.errors?.map((error) => error.message).join("; ") ??
        "Cloudflare API error";
      throw new Error(message);
    }

    return payload.result;
  }

  async function checkHostname(hostname: string) {
    const url = hostname.startsWith("http") ? hostname : `https://${hostname}`;
    const startedAt = Date.now();

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow",
      });

      return {
        hostname,
        online: response.ok || response.status < 500,
        statusCode: response.status,
        latencyMs: Date.now() - startedAt,
      };
    } catch {
      return {
        hostname,
        online: false,
        statusCode: null,
        latencyMs: null,
      };
    }
  }

  return {
    isConfigured: Boolean(config.apiToken && config.accountId),

    async checkStatus(): Promise<CloudflareStatusResponse> {
      const empty: CloudflareStatusResponse = {
        configured: false,
        online: false,
        tunnelId: config.tunnelId ?? null,
        tunnelName: null,
        tunnelStatus: null,
        activeConnections: null,
        hostnames: [],
      };

      if (!config.apiToken || !config.accountId) {
        return empty;
      }

      try {
        await cloudflareRequest<unknown>("/user/tokens/verify");

        let tunnelName: string | null = null;
        let tunnelStatus: string | null = null;
        let activeConnections: number | null = null;

        if (config.tunnelId) {
          const tunnel = await cloudflareRequest<CloudflareTunnelResult>(
            `/accounts/${config.accountId}/cfd_tunnel/${config.tunnelId}`,
          );
          tunnelName = tunnel.name ?? null;
          tunnelStatus = tunnel.status ?? null;
          activeConnections = tunnel.connections?.length ?? 0;
        }

        const hostnameChecks = await Promise.all(
          hostnames.map((hostname) => checkHostname(hostname)),
        );

        return {
          configured: true,
          online: true,
          tunnelId: config.tunnelId ?? null,
          tunnelName,
          tunnelStatus,
          activeConnections,
          hostnames: hostnameChecks,
        };
      } catch {
        return {
          ...empty,
          configured: true,
          online: false,
        };
      }
    },
  };
}

export type CloudflareClient = ReturnType<typeof createCloudflareClient>;
