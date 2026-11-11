import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  SystemDiskIoEntry,
  SystemFanEntry,
  SystemHardwareResponse,
  SystemHostFacts,
  SystemLoadAverage,
  SystemMountEntry,
  SystemOverviewResponse,
  SystemRaidEntry,
  SystemSensorEntry,
  SystemStorageResponse,
  SystemSwapUsage,
} from "@martylab/shared";

/**
 * Read-only collectors for the Système page.
 *
 * Everything here is a file read (`/proc`, `/sys`, `os`). No shell, no
 * `child_process`, no elevated privileges. When a source is missing the
 * collector returns `null` (or an empty list) instead of inventing a value.
 */

export interface SystemInfoConfig {
  hostProcPrefix?: string | undefined;
  hostSysPrefix?: string | undefined;
  hostRootPath?: string | undefined;
}

const REAL_FILESYSTEMS = new Set([
  "ext2",
  "ext3",
  "ext4",
  "xfs",
  "btrfs",
  "zfs",
  "f2fs",
  "reiserfs",
  "vfat",
  "exfat",
  "fuseblk",
  "nfs",
  "nfs4",
  "cifs",
]);

const DISK_DEVICE_PATTERN =
  /^(?:sd[a-z]+|hd[a-z]+|vd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+|md\d+|dm-\d+)$/;

const MAX_MOUNTS = 25;
const MAX_DISK_DEVICES = 12;
const MAX_SENSORS = 12;
const MAX_FANS = 6;

interface DiskCounters {
  readBytes: number;
  writtenBytes: number;
  readOps: number;
  writeOps: number;
}

interface DiskSample {
  timestamp: number;
  entries: Map<string, DiskCounters>;
}

let previousDiskSample: DiskSample | null = null;

function procPath(config: SystemInfoConfig, relativePath: string): string {
  return path.join(config.hostProcPrefix ?? "/proc", relativePath);
}

function sysPath(config: SystemInfoConfig, relativePath: string): string {
  return path.join(config.hostSysPrefix ?? "/sys", relativePath);
}

function rootPath(config: SystemInfoConfig, relativePath: string): string {
  return path.join(config.hostRootPath ?? "/", relativePath);
}

function sourceOf(config: SystemInfoConfig): "host" | "container" {
  return config.hostProcPrefix ? "host" : "container";
}

async function readOptional(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Pure parsers (unit-tested)                                                  */
/* -------------------------------------------------------------------------- */

export function parseLoadAverage(content: string): SystemLoadAverage | null {
  const match = /^([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\/(\d+)/.exec(content.trim());
  if (!match) {
    return null;
  }

  const [one, five, fifteen] = [match[1], match[2], match[3]].map((value) =>
    Number.parseFloat(value ?? ""),
  );
  if (![one, five, fifteen].every((value) => Number.isFinite(value))) {
    return null;
  }

  return {
    one: one as number,
    five: five as number,
    fifteen: fifteen as number,
    runningProcesses: Number.parseInt(match[4] ?? "0", 10),
    totalProcesses: Number.parseInt(match[5] ?? "0", 10),
  };
}

export function parseSwapUsage(content: string): SystemSwapUsage | null {
  const read = (key: string): number | null => {
    const match = new RegExp(`^${key}:\\s+(\\d+)`, "m").exec(content);
    return match?.[1] ? Number.parseInt(match[1], 10) * 1024 : null;
  };

  const totalBytes = read("SwapTotal");
  const freeBytes = read("SwapFree");
  if (totalBytes === null || freeBytes === null || totalBytes === 0) {
    return null;
  }

  return {
    totalBytes,
    freeBytes,
    usedBytes: Math.max(0, totalBytes - freeBytes),
  };
}

export function parseCpuModel(content: string): string | null {
  const match = /^model name\s*:\s*(.+)$/m.exec(content);
  const model = match?.[1]?.trim();
  return model && model.length > 0 ? model : null;
}

export function parseOsRelease(content: string): string | null {
  const match = /^PRETTY_NAME="?([^"\n]+)"?$/m.exec(content);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
}

export function parseBootTimestamp(content: string): string | null {
  const match = /^btime\s+(\d+)$/m.exec(content);
  const seconds = match?.[1] ? Number.parseInt(match[1], 10) : Number.NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return new Date(seconds * 1000).toISOString();
}

export interface MountTableEntry {
  device: string;
  mountPoint: string;
  fileSystem: string;
}

function unescapeMountField(value: string): string {
  return value.replace(/\\([0-7]{3})/g, (_match, code: string) =>
    String.fromCharCode(Number.parseInt(code, 8)),
  );
}

export function parseMountTable(content: string): MountTableEntry[] {
  const entries: MountTableEntry[] = [];

  for (const line of content.split("\n")) {
    const fields = line.trim().split(/\s+/);
    if (fields.length < 3) {
      continue;
    }
    const [device, mountPoint, fileSystem] = fields;
    if (!device || !mountPoint || !fileSystem) {
      continue;
    }

    entries.push({
      device: unescapeMountField(device),
      mountPoint: unescapeMountField(mountPoint),
      fileSystem,
    });
  }

  return entries;
}

export function parseDiskStats(content: string): Map<string, DiskCounters> {
  const entries = new Map<string, DiskCounters>();

  for (const line of content.split("\n")) {
    const fields = line.trim().split(/\s+/);
    if (fields.length < 14) {
      continue;
    }

    const name = fields[2];
    if (!name || !DISK_DEVICE_PATTERN.test(name)) {
      // Partitions (sda1, nvme0n1p1) and loop/ram devices are skipped.
      continue;
    }

    const readOps = Number.parseInt(fields[3] ?? "0", 10);
    const sectorsRead = Number.parseInt(fields[5] ?? "0", 10);
    const writeOps = Number.parseInt(fields[7] ?? "0", 10);
    const sectorsWritten = Number.parseInt(fields[9] ?? "0", 10);

    entries.set(name, {
      readBytes: sectorsRead * 512,
      writtenBytes: sectorsWritten * 512,
      readOps,
      writeOps,
    });
  }

  return entries;
}

export function computeDiskIoRates(
  current: Map<string, DiskCounters>,
  timestamp: number,
): SystemDiskIoEntry[] {
  const previous = previousDiskSample;

  const rates: SystemDiskIoEntry[] = [];
  const elapsedSeconds = previous
    ? Math.max(0.001, (timestamp - previous.timestamp) / 1000)
    : null;

  for (const [device, counters] of current) {
    const before = previous?.entries.get(device);

    rates.push({
      device,
      readBytesPerSecond:
        elapsedSeconds && before
          ? Math.round(
              Math.max(0, counters.readBytes - before.readBytes) / elapsedSeconds,
            )
          : 0,
      writeBytesPerSecond:
        elapsedSeconds && before
          ? Math.round(
              Math.max(0, counters.writtenBytes - before.writtenBytes) /
                elapsedSeconds,
            )
          : 0,
      readOperationsPerSecond:
        elapsedSeconds && before
          ? Math.round(
              Math.max(0, counters.readOps - before.readOps) / elapsedSeconds,
            )
          : 0,
      writeOperationsPerSecond:
        elapsedSeconds && before
          ? Math.round(
              Math.max(0, counters.writeOps - before.writeOps) / elapsedSeconds,
            )
          : 0,
    });
  }

  previousDiskSample = { timestamp, entries: current };

  return rates
    .sort((a, b) => a.device.localeCompare(b.device))
    .slice(0, MAX_DISK_DEVICES);
}

export function parseMdstat(content: string): SystemRaidEntry[] {
  const blocks = content.split(/\n(?=\w+\s*:)/);
  const arrays: SystemRaidEntry[] = [];

  for (const block of blocks) {
    const header = /^(\w+)\s*:\s*(active|inactive)(?:\s+(\S+))?/.exec(block);
    if (!header?.[1]) {
      continue;
    }

    const members = /\[(\d+)\/(\d+)\]/.exec(block);
    // mdstat uses [total/active]: the second number is the active count.
    const totalDevices = members?.[1] ? Number.parseInt(members[1], 10) : 0;
    const activeDevices = members?.[2] ? Number.parseInt(members[2], 10) : 0;

    arrays.push({
      name: header[1],
      level: header[3] ?? "—",
      state:
        header[2] === "active"
          ? activeDevices === totalDevices
            ? "active"
            : "degraded"
          : "inactive",
      activeDevices,
      totalDevices,
    });
  }

  return arrays;
}

/* -------------------------------------------------------------------------- */
/* Collectors                                                                  */
/* -------------------------------------------------------------------------- */

async function collectFacts(config: SystemInfoConfig): Promise<SystemHostFacts> {
  const [hostname, kernel, cpuinfo, osRelease, stat, governor] =
    await Promise.all([
      readOptional(procPath(config, "sys/kernel/hostname")),
      readOptional(procPath(config, "sys/kernel/osrelease")),
      readOptional(procPath(config, "cpuinfo")),
      readOptional(rootPath(config, "etc/os-release")),
      readOptional(procPath(config, "stat")),
      readOptional(
        sysPath(config, "devices/system/cpu/cpu0/cpufreq/scaling_governor"),
      ),
    ]);

  return {
    hostname: hostname?.trim() || os.hostname(),
    os: osRelease ? parseOsRelease(osRelease) : null,
    kernel: kernel?.trim() || os.release(),
    architecture: os.arch(),
    bootTime: stat ? parseBootTimestamp(stat) : null,
    cpuModel: cpuinfo ? parseCpuModel(cpuinfo) : null,
    governor: governor?.trim() || null,
  };
}

async function collectOverview(
  config: SystemInfoConfig,
): Promise<SystemOverviewResponse> {
  const timestamp = new Date().toISOString();
  const [loadContent, meminfo, facts] = await Promise.all([
    readOptional(procPath(config, "loadavg")),
    readOptional(procPath(config, "meminfo")),
    collectFacts(config),
  ]);

  return {
    source: sourceOf(config),
    timestamp,
    facts,
    load: loadContent ? parseLoadAverage(loadContent) : null,
    swap: meminfo ? parseSwapUsage(meminfo) : null,
  };
}

async function collectMounts(
  config: SystemInfoConfig,
): Promise<SystemMountEntry[]> {
  const content =
    (await readOptional(procPath(config, "mounts"))) ??
    (await readOptional(procPath(config, "self/mounts")));

  if (!content) {
    return [];
  }

  const seen = new Set<string>();
  const candidates = parseMountTable(content).filter((entry) => {
    if (!REAL_FILESYSTEMS.has(entry.fileSystem)) return false;
    if (seen.has(entry.mountPoint)) return false;
    seen.add(entry.mountPoint);
    return true;
  });

  const mounts: SystemMountEntry[] = [];

  for (const entry of candidates.slice(0, MAX_MOUNTS)) {
    const target = config.hostRootPath
      ? path.join(config.hostRootPath, entry.mountPoint)
      : entry.mountPoint;

    try {
      const stats = await fs.statfs(target);
      const totalBytes = stats.blocks * stats.bsize;
      const availableBytes = stats.bavail * stats.bsize;
      const usedBytes = Math.max(0, totalBytes - availableBytes);
      const usagePercent =
        totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;
      const inodeUsagePercent =
        stats.files > 0
          ? Math.round(((stats.files - stats.ffree) / stats.files) * 1000) / 10
          : null;

      mounts.push({
        mountPoint: entry.mountPoint,
        device: entry.device,
        fileSystem: entry.fileSystem,
        totalBytes,
        usedBytes,
        availableBytes,
        usagePercent,
        inodeUsagePercent,
      });
    } catch {
      // Mount not reachable from the backend (permissions or mount namespace).
    }
  }

  return mounts.sort((a, b) => a.mountPoint.localeCompare(b.mountPoint));
}

async function collectStorage(
  config: SystemInfoConfig,
): Promise<SystemStorageResponse> {
  const timestamp = Date.now();

  const [mounts, diskstats, mdstat] = await Promise.all([
    collectMounts(config),
    readOptional(procPath(config, "diskstats")),
    readOptional(procPath(config, "mdstat")),
  ]);

  return {
    source: sourceOf(config),
    timestamp: new Date(timestamp).toISOString(),
    mounts,
    diskIo: diskstats
      ? computeDiskIoRates(parseDiskStats(diskstats), timestamp)
      : [],
    raid: mdstat ? parseMdstat(mdstat) : [],
  };
}

async function collectSensors(
  config: SystemInfoConfig,
): Promise<{ sensors: SystemSensorEntry[]; fans: SystemFanEntry[] }> {
  const base = sysPath(config, "class/hwmon");
  let chips: string[];

  try {
    chips = (await fs.readdir(base)).filter((entry) => entry.startsWith("hwmon"));
  } catch {
    return { sensors: [], fans: [] };
  }

  const sensors: SystemSensorEntry[] = [];
  const fans: SystemFanEntry[] = [];

  for (const chip of chips) {
    const chipPath = path.join(base, chip);
    const chipName = (await readOptional(path.join(chipPath, "name")))?.trim();
    let files: string[];

    try {
      files = await fs.readdir(chipPath);
    } catch {
      continue;
    }

    for (const file of files) {
      const temperatureMatch = /^temp(\d+)_input$/.exec(file);
      if (temperatureMatch?.[1]) {
        const raw = await readOptional(path.join(chipPath, file));
        const milliCelsius = raw ? Number.parseInt(raw.trim(), 10) : Number.NaN;
        if (!Number.isFinite(milliCelsius) || milliCelsius <= 0) continue;
        const celsius = Math.round((milliCelsius / 1000) * 10) / 10;
        if (celsius <= 0 || celsius > 150) continue;

        const label =
          (
            await readOptional(
              path.join(chipPath, `temp${temperatureMatch[1]}_label`),
            )
          )?.trim() ||
          `${chipName ?? chip} temp${temperatureMatch[1]}`;

        sensors.push({ label, celsius });
        continue;
      }

      const fanMatch = /^fan(\d+)_input$/.exec(file);
      if (fanMatch?.[1]) {
        const raw = await readOptional(path.join(chipPath, file));
        const rpm = raw ? Number.parseInt(raw.trim(), 10) : Number.NaN;
        if (!Number.isFinite(rpm) || rpm <= 0) continue;

        const label =
          (await readOptional(path.join(chipPath, `fan${fanMatch[1]}_label`)))
            ?.trim() || `${chipName ?? chip} fan${fanMatch[1]}`;

        fans.push({ label, rpm });
      }
    }
  }

  return {
    sensors: sensors
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, MAX_SENSORS),
    fans: fans.sort((a, b) => a.label.localeCompare(b.label)).slice(0, MAX_FANS),
  };
}

async function collectHardware(
  config: SystemInfoConfig,
): Promise<SystemHardwareResponse> {
  const [facts, sensorData] = await Promise.all([
    collectFacts(config),
    collectSensors(config),
  ]);

  return {
    source: sourceOf(config),
    timestamp: new Date().toISOString(),
    facts,
    cpuCores: os.cpus().length,
    sensors: sensorData.sensors,
    fans: sensorData.fans,
  };
}

export function createSystemInfoService(config: SystemInfoConfig) {
  return {
    getOverview: () => collectOverview(config),
    getStorage: () => collectStorage(config),
    getHardware: () => collectHardware(config),
  };
}

export type SystemInfoService = ReturnType<typeof createSystemInfoService>;
