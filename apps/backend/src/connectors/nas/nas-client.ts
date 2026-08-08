import type { NasStatusResponse } from "@martylab/shared";
import { fetchJson } from "../../lib/http-client.js";

export interface NasClientConfig {
  baseUrl?: string | undefined;
  apiToken?: string | undefined;
  timeoutMs?: number | undefined;
  allowInsecureTls?: boolean | undefined;
}

interface UgreenEnvelope<T> {
  code?: number;
  msg?: string;
  data?: T;
}

interface UgreenStoragePoolRow {
  name?: string;
  label?: string;
  total?: number;
  used?: number;
  free?: number;
  status?: number;
}

interface UgreenDeviceMonitoring {
  cpu_usage_rate?: number;
  ram_usage_rate?: number | string;
}

interface UgreenTemperatureMonitoring {
  cpu_temperature?: number;
  disk_list?: Array<{
    label?: string;
    temperature?: number;
    status?: number;
  }>;
}

interface UgreenSystemStatus {
  dev_name?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function usagePercent(used: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((used / total) * 1000) / 10;
}

export function createNasClient(config: NasClientConfig) {
  const baseUrl = config.baseUrl ? normalizeBaseUrl(config.baseUrl) : undefined;
  const timeoutMs = config.timeoutMs ?? 6_000;
  const allowInsecureTls = config.allowInsecureTls ?? true;

  async function ugreenRequest<T>(path: string): Promise<T | null> {
    if (!baseUrl || !config.apiToken) {
      return null;
    }

    const separator = path.includes("?") ? "&" : "?";
    const payload = await fetchJson<UgreenEnvelope<T>>(
      `${baseUrl}${path}${separator}token=${encodeURIComponent(config.apiToken)}`,
      {
        timeoutMs,
        allowInsecureTls,
        headers: {
          "user-agent": "PC/WEB",
        },
      },
    );

    if (payload.code !== 200 || payload.data === undefined) {
      return null;
    }

    return payload.data;
  }

  return {
    isConfigured: Boolean(baseUrl && config.apiToken),

    async checkStatus(): Promise<NasStatusResponse> {
      const empty: NasStatusResponse = {
        configured: false,
        online: false,
        deviceName: null,
        cpuUsagePercent: null,
        ramUsagePercent: null,
        cpuTemperatureCelsius: null,
        storagePools: [],
        disks: [],
      };

      if (!baseUrl || !config.apiToken) {
        return empty;
      }

      try {
        const heartbeat = await ugreenRequest<unknown>("/ugreen/v1/verify/heartbeat");
        if (!heartbeat) {
          return { ...empty, configured: true, online: false };
        }

        const [systemStatus, deviceMonitoring, temperatureMonitoring, pools] =
          await Promise.all([
            ugreenRequest<UgreenSystemStatus>(
              "/ugreen/v1/desktop/components/data?id=desktop.component.SystemStatus",
            ),
            ugreenRequest<UgreenDeviceMonitoring>(
              "/ugreen/v1/desktop/components/data?id=desktop.component.DeviceMonitoring",
            ),
            ugreenRequest<UgreenTemperatureMonitoring>(
              "/ugreen/v1/desktop/components/data?id=desktop.component.TemperatureMonitoring",
            ),
            ugreenRequest<{ result?: UgreenStoragePoolRow[] }>(
              "/ugreen/v1/storage/pool/list",
            ),
          ]);

        const poolRows = pools?.result ?? [];
        const storagePools = poolRows.map((pool) => {
          const total = pool.total ?? 0;
          const used = pool.used ?? 0;
          const free = pool.free ?? Math.max(0, total - used);

          return {
            name: pool.name ?? pool.label ?? "pool",
            label: pool.label ?? null,
            totalBytes: total,
            usedBytes: used,
            freeBytes: free,
            usagePercent: usagePercent(used, total),
            status:
              pool.status === 0
                ? "ok"
                : pool.status !== undefined
                  ? String(pool.status)
                  : null,
          };
        });

        const disks =
          temperatureMonitoring?.disk_list?.map((disk) => ({
            label: disk.label ?? "Disque",
            temperatureCelsius:
              typeof disk.temperature === "number" ? disk.temperature : null,
            status:
              disk.status === 0
                ? "ok"
                : disk.status !== undefined
                  ? String(disk.status)
                  : null,
          })) ?? [];

        const ramRaw = deviceMonitoring?.ram_usage_rate;
        const ramUsagePercent =
          typeof ramRaw === "number"
            ? ramRaw
            : typeof ramRaw === "string"
              ? Number.parseFloat(ramRaw)
              : null;

        return {
          configured: true,
          online: true,
          deviceName: systemStatus?.dev_name ?? null,
          cpuUsagePercent: deviceMonitoring?.cpu_usage_rate ?? null,
          ramUsagePercent: Number.isFinite(ramUsagePercent)
            ? ramUsagePercent
            : null,
          cpuTemperatureCelsius: temperatureMonitoring?.cpu_temperature ?? null,
          storagePools,
          disks,
        };
      } catch {
        return { ...empty, configured: true, online: false };
      }
    },
  };
}

export type NasClient = ReturnType<typeof createNasClient>;
