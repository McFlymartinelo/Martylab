import type { OrionClimateResponse } from "@martylab/shared";

export interface OrionClientConfig {
  baseUrl?: string | undefined;
  apiKey?: string | undefined;
  timeoutMs?: number | undefined;
}

interface OrionHealthPayload {
  ok?: boolean;
}

interface OrionNetatmoPayload {
  indoorTemp?: number | null;
  indoorHumidity?: number | null;
  outdoorTemp?: number | null;
  outdoorHumidity?: number | null;
  co2?: number | null;
  moduleName?: string | null;
  lastSeen?: string | null;
  error?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function createOrionClient(config: OrionClientConfig) {
  const baseUrl = config.baseUrl ? normalizeBaseUrl(config.baseUrl) : undefined;
  const timeoutMs = config.timeoutMs ?? 6_000;

  function buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }

    return headers;
  }

  async function request<T>(path: string): Promise<T> {
    if (!baseUrl) {
      throw new Error("Orion URL is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: buildHeaders(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Orion API error ${response.status}${text ? `: ${text}` : ""}`,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    isConfigured: Boolean(baseUrl),

    async checkHealth(): Promise<boolean> {
      if (!baseUrl) {
        return false;
      }

      try {
        const payload = await request<OrionHealthPayload>("/api/health");
        return payload.ok === true;
      } catch {
        return false;
      }
    },

    async getClimate(): Promise<OrionClimateResponse> {
      if (!baseUrl) {
        return {
          available: false,
          moduleName: null,
          lastSeen: null,
          indoor: { temperatureCelsius: null, humidityPercent: null },
          outdoor: { temperatureCelsius: null, humidityPercent: null },
          co2Ppm: null,
        };
      }

      try {
        const payload = await request<OrionNetatmoPayload>("/api/netatmo");

        return {
          available: true,
          moduleName: payload.moduleName ?? null,
          lastSeen: payload.lastSeen ?? null,
          indoor: {
            temperatureCelsius: payload.indoorTemp ?? null,
            humidityPercent: payload.indoorHumidity ?? null,
          },
          outdoor: {
            temperatureCelsius: payload.outdoorTemp ?? null,
            humidityPercent: payload.outdoorHumidity ?? null,
          },
          co2Ppm: payload.co2 ?? null,
        };
      } catch {
        return {
          available: false,
          moduleName: null,
          lastSeen: null,
          indoor: { temperatureCelsius: null, humidityPercent: null },
          outdoor: { temperatureCelsius: null, humidityPercent: null },
          co2Ppm: null,
        };
      }
    },
  };
}

export type OrionClient = ReturnType<typeof createOrionClient>;
