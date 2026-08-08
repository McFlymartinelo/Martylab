import type {
  OrionClimateResponse,
  OrionLight,
  OrionLightsResponse,
  OrionSetLightRequest,
  OrionSetLightResponse,
} from "@martylab/shared";

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

interface HueLightState {
  on?: boolean;
  bri?: number;
  reachable?: boolean;
}

interface HueLightRow {
  name?: string;
  state?: HueLightState;
}

type HueLightsPayload = Record<string, HueLightRow>;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function brightnessToHueBri(brightness: number): number {
  const clamped = Math.max(1, Math.min(100, brightness));
  return Math.max(1, Math.min(254, Math.round((clamped / 100) * 254)));
}

function hueBriToBrightness(bri: number | undefined): number | null {
  if (bri === undefined) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round((bri / 254) * 100)));
}

function normalizeLights(payload: HueLightsPayload): OrionLight[] {
  return Object.entries(payload)
    .map(([id, light]) => ({
      id,
      name: light.name ?? `Lumière ${id}`,
      on: light.state?.on ?? false,
      brightness: hueBriToBrightness(light.state?.bri),
      reachable: light.state?.reachable !== false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function createOrionClient(config: OrionClientConfig) {
  const baseUrl = config.baseUrl ? normalizeBaseUrl(config.baseUrl) : undefined;
  const timeoutMs = config.timeoutMs ?? 6_000;

  function buildHeaders(includeJson = false): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }

    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`;
    }

    return headers;
  }

  async function request<T>(
    path: string,
    options: { method?: "GET" | "PUT"; body?: unknown } = {},
  ): Promise<T> {
    if (!baseUrl) {
      throw new Error("Orion URL is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const init: RequestInit = {
        method: options.method ?? "GET",
        headers: buildHeaders(options.body !== undefined),
        signal: controller.signal,
      };

      if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
      }

      const response = await fetch(`${baseUrl}${path}`, init);

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

    async getLights(): Promise<OrionLightsResponse> {
      if (!baseUrl) {
        return { available: false, lights: [] };
      }

      try {
        const payload = await request<HueLightsPayload>("/api/hue/lights");
        return {
          available: true,
          lights: normalizeLights(payload),
        };
      } catch {
        return { available: false, lights: [] };
      }
    },

    async setLightState(
      lightId: string,
      input: OrionSetLightRequest,
    ): Promise<OrionSetLightResponse> {
      if (!baseUrl) {
        throw new Error("Orion URL is not configured.");
      }

      const state: { on?: boolean; bri?: number } = {};

      if (input.on !== undefined) {
        state.on = input.on;
      }

      if (input.brightness !== undefined) {
        state.bri = brightnessToHueBri(input.brightness);
      }

      await request<unknown>(`/api/hue/lights/${encodeURIComponent(lightId)}`, {
        method: "PUT",
        body: state,
      });

      return { ok: true, lightId };
    },
  };
}

export type OrionClient = ReturnType<typeof createOrionClient>;
