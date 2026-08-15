import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  collectNetworkStats,
  collectProcessStats,
} from "./server-host-stats.js";

export interface ServerMetricsSnapshot {
  source: "host" | "container";
  timestamp: string;
  cpu: {
    usagePercent: number;
    cores: number;
  };
  memory: {
    usedBytes: number;
    totalBytes: number;
    usagePercent: number;
  };
  storage: {
    usedBytes: number;
    totalBytes: number;
    usagePercent: number;
    path: string;
  };
  uptimeSeconds: number;
  temperatureCelsius: number | null;
}

interface ServerMetricsConfig {
  hostProcPrefix?: string | undefined;
  hostSysPrefix?: string | undefined;
  hostRootPath?: string | undefined;
}

const cpuHistory: number[] = [];
const CPU_HISTORY_SIZE = 20;

function pushCpuHistory(value: number) {
  cpuHistory.push(value);
  if (cpuHistory.length > CPU_HISTORY_SIZE) {
    cpuHistory.shift();
  }
}

function procPath(config: ServerMetricsConfig, relativePath: string): string {
  if (config.hostProcPrefix) {
    return path.join(config.hostProcPrefix, relativePath);
  }
  return path.join("/proc", relativePath);
}

function sysPath(config: ServerMetricsConfig, relativePath: string): string {
  if (config.hostSysPrefix) {
    return path.join(config.hostSysPrefix, relativePath);
  }
  return path.join("/sys", relativePath);
}

async function readCpuTimes(
  config: ServerMetricsConfig,
): Promise<{ idle: number; total: number }> {
  const stat = await fs.readFile(procPath(config, "stat"), "utf8");
  const cpuLine = stat.split("\n")[0];
  if (!cpuLine?.startsWith("cpu ")) {
    throw new Error("Unable to read CPU stats.");
  }

  const values = cpuLine
    .slice(4)
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));

  const idle = (values[3] ?? 0) + (values[4] ?? 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  return { idle, total };
}

async function sampleCpuUsagePercent(
  config: ServerMetricsConfig,
): Promise<number> {
  const first = await readCpuTimes(config);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const second = await readCpuTimes(config);

  const idleDelta = second.idle - first.idle;
  const totalDelta = second.total - first.total;

  if (totalDelta <= 0) {
    return 0;
  }

  const usage = ((totalDelta - idleDelta) / totalDelta) * 100;
  return Math.max(0, Math.min(100, Math.round(usage * 10) / 10));
}

async function readMemory(
  config: ServerMetricsConfig,
): Promise<{ usedBytes: number; totalBytes: number; usagePercent: number }> {
  if (config.hostProcPrefix) {
    const meminfo = await fs.readFile(procPath(config, "meminfo"), "utf8");
    const values = new Map<string, number>();

    for (const line of meminfo.split("\n")) {
      const match = /^([A-Za-z()]+):\s+(\d+)/.exec(line);
      if (!match?.[1] || !match[2]) continue;
      values.set(match[1], Number.parseInt(match[2], 10) * 1024);
    }

    const totalBytes = values.get("MemTotal") ?? 0;
    const availableBytes =
      values.get("MemAvailable") ?? values.get("MemFree") ?? 0;
    const usedBytes = Math.max(0, totalBytes - availableBytes);
    const usagePercent =
      totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;

    return { usedBytes, totalBytes, usagePercent };
  }

  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;
  const usagePercent =
    totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;

  return { usedBytes, totalBytes, usagePercent };
}

async function readStorage(
  targetPath: string,
): Promise<{ usedBytes: number; totalBytes: number; usagePercent: number }> {
  const stats = await fs.statfs(targetPath);
  const totalBytes = stats.blocks * stats.bsize;
  const availableBytes = stats.bavail * stats.bsize;
  const usedBytes = Math.max(0, totalBytes - availableBytes);
  const usagePercent =
    totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;

  return { usedBytes, totalBytes, usagePercent };
}

async function readUptimeSeconds(
  config: ServerMetricsConfig,
): Promise<number> {
  if (config.hostProcPrefix) {
    const uptime = await fs.readFile(procPath(config, "uptime"), "utf8");
    const value = Number.parseFloat(uptime.split(" ")[0] ?? "0");
    return Number.isFinite(value) ? Math.floor(value) : 0;
  }

  return Math.floor(os.uptime());
}

async function readTemperature(
  config: ServerMetricsConfig,
): Promise<number | null> {
  const thermalBase = sysPath(config, "class/thermal");

  try {
    const zones = await fs.readdir(thermalBase);
    for (const zone of zones.filter((entry) => entry.startsWith("thermal_zone"))) {
      const tempPath = path.join(thermalBase, zone, "temp");
      const raw = await fs.readFile(tempPath, "utf8");
      const milliCelsius = Number.parseInt(raw.trim(), 10);
      if (Number.isFinite(milliCelsius) && milliCelsius > 0) {
        return Math.round((milliCelsius / 1000) * 10) / 10;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getCpuHistory(): number[] {
  return [...cpuHistory];
}

export async function collectServerMetrics(
  config: ServerMetricsConfig,
): Promise<ServerMetricsSnapshot> {
  const storagePath = config.hostRootPath ?? "/";
  const source = config.hostProcPrefix ? "host" : "container";

  const [cpuUsagePercent, memory, storage, uptimeSeconds, temperatureCelsius] =
    await Promise.all([
      sampleCpuUsagePercent(config),
      readMemory(config),
      readStorage(storagePath),
      readUptimeSeconds(config),
      readTemperature(config),
    ]);

  pushCpuHistory(cpuUsagePercent);

  return {
    source,
    timestamp: new Date().toISOString(),
    cpu: {
      usagePercent: cpuUsagePercent,
      cores: os.cpus().length,
    },
    memory,
    storage: {
      ...storage,
      path: storagePath,
    },
    uptimeSeconds,
    temperatureCelsius,
  };
}

export function createServerMetricsService(config: ServerMetricsConfig) {
  return {
    getMetrics: () => collectServerMetrics(config),
    getCpuHistory,
    getNetworkStats: () => collectNetworkStats(config),
    getProcessStats: () => collectProcessStats(config),
  };
}

export type ServerMetricsService = ReturnType<typeof createServerMetricsService>;
