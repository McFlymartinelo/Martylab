import fs from "node:fs/promises";
import path from "node:path";

interface HostStatsConfig {
  hostProcPrefix?: string | undefined;
  hostSysPrefix?: string | undefined;
}

export interface NetworkInterfaceSnapshot {
  name: string;
  receiveBytes: number;
  transmitBytes: number;
  receivePackets: number;
  transmitPackets: number;
  receiveErrors: number;
  transmitErrors: number;
}

export interface NetworkStatsSnapshot {
  source: "host" | "container";
  timestamp: string;
  receiveBytesPerSecond: number;
  transmitBytesPerSecond: number;
  receiveHistory: number[];
  transmitHistory: number[];
  interfaces: Array<{
    name: string;
    receiveBytesPerSecond: number;
    transmitBytesPerSecond: number;
    operState: string | null;
    macAddress: string | null;
    speedMbps: number | null;
    mtu: number | null;
    receivePackets: number;
    transmitPackets: number;
    receiveErrors: number;
    transmitErrors: number;
  }>;
}

export interface ProcessStatsSnapshot {
  source: "host" | "container";
  timestamp: string;
  processes: Array<{
    pid: number;
    name: string;
    memoryBytes: number;
    memoryPercent: number;
    state: string;
    uid: number | null;
    cpuTimeTicks: number | null;
  }>;
}

const NETWORK_HISTORY_SIZE = 20;
const receiveHistory: number[] = [];
const transmitHistory: number[] = [];

let previousNetworkSample:
  | {
      timestamp: number;
      interfaces: Map<string, { receiveBytes: number; transmitBytes: number }>;
    }
  | null = null;

function procRoot(config: HostStatsConfig): string {
  return config.hostProcPrefix ?? "/proc";
}

function pushNetworkHistory(receive: number, transmit: number) {
  receiveHistory.push(receive);
  transmitHistory.push(transmit);
  if (receiveHistory.length > NETWORK_HISTORY_SIZE) {
    receiveHistory.shift();
    transmitHistory.shift();
  }
}

async function readNetworkInterfaces(
  config: HostStatsConfig,
): Promise<NetworkInterfaceSnapshot[]> {
  const content = await fs.readFile(
    path.join(procRoot(config), "net/dev"),
    "utf8",
  );
  const interfaces: NetworkInterfaceSnapshot[] = [];

  for (const line of content.split("\n").slice(2)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const name = trimmed.slice(0, colonIndex).trim();
    if (!name || name === "lo") continue;

    const values = trimmed
      .slice(colonIndex + 1)
      .trim()
      .split(/\s+/)
      .map((value) => Number.parseInt(value, 10));

    if (values.length < 9) continue;

    interfaces.push({
      name,
      receiveBytes: values[0] ?? 0,
      transmitBytes: values[8] ?? 0,
      receivePackets: values[1] ?? 0,
      transmitPackets: values[9] ?? 0,
      receiveErrors: values[2] ?? 0,
      transmitErrors: values[10] ?? 0,
    });
  }

  return interfaces;
}

async function readOptionalText(filePath: string): Promise<string | null> {
  try {
    return (await fs.readFile(filePath, "utf8")).trim();
  } catch {
    return null;
  }
}

interface InterfaceMetadata {
  operState: string | null;
  macAddress: string | null;
  speedMbps: number | null;
  mtu: number | null;
}

async function readInterfaceMetadata(
  config: HostStatsConfig,
  name: string,
): Promise<InterfaceMetadata> {
  const base = path.join(config.hostSysPrefix ?? "/sys", "class/net", name);
  const [operState, macAddress, speed, mtu] = await Promise.all([
    readOptionalText(path.join(base, "operstate")),
    readOptionalText(path.join(base, "address")),
    readOptionalText(path.join(base, "speed")),
    readOptionalText(path.join(base, "mtu")),
  ]);

  const parsedSpeed = speed ? Number.parseInt(speed, 10) : Number.NaN;
  const parsedMtu = mtu ? Number.parseInt(mtu, 10) : Number.NaN;

  return {
    operState,
    macAddress,
    speedMbps:
      Number.isFinite(parsedSpeed) && parsedSpeed > 0 ? parsedSpeed : null,
    mtu: Number.isFinite(parsedMtu) && parsedMtu > 0 ? parsedMtu : null,
  };
}

function computeRates(
  current: NetworkInterfaceSnapshot[],
  metadata: Map<string, InterfaceMetadata>,
  timestamp: number,
): {
  receiveBytesPerSecond: number;
  transmitBytesPerSecond: number;
  interfaces: NetworkStatsSnapshot["interfaces"];
} {
  const currentMap = new Map(
    current.map((iface) => [
      iface.name,
      { receiveBytes: iface.receiveBytes, transmitBytes: iface.transmitBytes },
    ]),
  );

  const describe = (
    iface: NetworkInterfaceSnapshot,
    receiveBytesPerSecond: number,
    transmitBytesPerSecond: number,
  ): NetworkStatsSnapshot["interfaces"][number] => {
    const meta = metadata.get(iface.name);
    return {
      name: iface.name,
      receiveBytesPerSecond,
      transmitBytesPerSecond,
      operState: meta?.operState ?? null,
      macAddress: meta?.macAddress ?? null,
      speedMbps: meta?.speedMbps ?? null,
      mtu: meta?.mtu ?? null,
      receivePackets: iface.receivePackets,
      transmitPackets: iface.transmitPackets,
      receiveErrors: iface.receiveErrors,
      transmitErrors: iface.transmitErrors,
    };
  };

  if (!previousNetworkSample) {
    previousNetworkSample = { timestamp, interfaces: currentMap };
    return {
      receiveBytesPerSecond: 0,
      transmitBytesPerSecond: 0,
      interfaces: current.map((iface) => describe(iface, 0, 0)),
    };
  }

  const elapsedSeconds = Math.max(
    0.001,
    (timestamp - previousNetworkSample.timestamp) / 1000,
  );

  let totalReceiveDelta = 0;
  let totalTransmitDelta = 0;

  const interfaces = current.map((iface) => {
    const previous = previousNetworkSample?.interfaces.get(iface.name);
    const receiveDelta = previous
      ? Math.max(0, iface.receiveBytes - previous.receiveBytes)
      : 0;
    const transmitDelta = previous
      ? Math.max(0, iface.transmitBytes - previous.transmitBytes)
      : 0;

    totalReceiveDelta += receiveDelta;
    totalTransmitDelta += transmitDelta;

    return describe(
      iface,
      Math.round(receiveDelta / elapsedSeconds),
      Math.round(transmitDelta / elapsedSeconds),
    );
  });

  previousNetworkSample = { timestamp, interfaces: currentMap };

  return {
    receiveBytesPerSecond: Math.round(totalReceiveDelta / elapsedSeconds),
    transmitBytesPerSecond: Math.round(totalTransmitDelta / elapsedSeconds),
    interfaces: interfaces.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

async function readTotalMemoryBytes(config: HostStatsConfig): Promise<number> {
  const content = await fs.readFile(
    path.join(procRoot(config), "meminfo"),
    "utf8",
  );
  const match = /^MemTotal:\s+(\d+)/m.exec(content);
  if (!match?.[1]) return 0;
  return Number.parseInt(match[1], 10) * 1024;
}

function parseStatusField(content: string, field: string): string | null {
  const match = new RegExp(`^${field}:\\s+(.+)$`, "m").exec(content);
  return match?.[1]?.trim() ?? null;
}

/**
 * Cumulative CPU time (utime + stime) in clock ticks, read from
 * `/proc/[pid]/stat`. The executable name may contain spaces and parentheses,
 * so fields are parsed from the last closing parenthesis.
 */
function readCpuTimeTicks(stat: string): number | null {
  const closing = stat.lastIndexOf(")");
  if (closing === -1) {
    return null;
  }

  const fields = stat.slice(closing + 2).trim().split(/\s+/);
  const utime = Number.parseInt(fields[11] ?? "", 10);
  const stime = Number.parseInt(fields[12] ?? "", 10);
  if (!Number.isFinite(utime) || !Number.isFinite(stime)) {
    return null;
  }

  return utime + stime;
}

async function readTopProcesses(
  config: HostStatsConfig,
  limit = 12,
): Promise<ProcessStatsSnapshot["processes"]> {
  const root = procRoot(config);
  const [entries, totalMemoryBytes] = await Promise.all([
    fs.readdir(root),
    readTotalMemoryBytes(config),
  ]);

  const processes: ProcessStatsSnapshot["processes"] = [];
  const pids = entries
    .filter((entry) => /^\d+$/.test(entry))
    .map((entry) => Number.parseInt(entry, 10))
    .filter((pid) => Number.isFinite(pid))
    .slice(0, 250);

  for (const pid of pids) {
    try {
      const processRoot = path.join(root, String(pid));
      const [status, stat] = await Promise.all([
        fs.readFile(path.join(processRoot, "status"), "utf8"),
        readOptionalText(path.join(processRoot, "stat")),
      ]);
      const name = parseStatusField(status, "Name");
      const rssKb = parseStatusField(status, "VmRSS");
      const state = parseStatusField(status, "State")?.charAt(0) ?? "?";
      const uidField = parseStatusField(status, "Uid");
      const uid = uidField ? Number.parseInt(uidField.split(/\s+/)[0] ?? "", 10) : NaN;

      if (!name || !rssKb) continue;

      const memoryKb = Number.parseInt(rssKb.replace(/\D/g, ""), 10);
      if (!Number.isFinite(memoryKb) || memoryKb <= 0) continue;

      const memoryBytes = memoryKb * 1024;
      const memoryPercent =
        totalMemoryBytes > 0
          ? Math.round((memoryBytes / totalMemoryBytes) * 1000) / 10
          : 0;

      processes.push({
        pid,
        name,
        memoryBytes,
        memoryPercent,
        state,
        uid: Number.isFinite(uid) ? uid : null,
        cpuTimeTicks: stat ? readCpuTimeTicks(stat) : null,
      });
    } catch {
      // Process may have exited between readdir and read.
    }
  }

  return processes
    .sort((a, b) => b.memoryBytes - a.memoryBytes)
    .slice(0, limit);
}

export async function collectNetworkStats(
  config: HostStatsConfig,
): Promise<NetworkStatsSnapshot> {
  const timestamp = Date.now();
  const interfaces = await readNetworkInterfaces(config);
  const metadata = new Map(
    await Promise.all(
      interfaces.map(
        async (iface) =>
          [iface.name, await readInterfaceMetadata(config, iface.name)] as const,
      ),
    ),
  );
  const rates = computeRates(interfaces, metadata, timestamp);

  pushNetworkHistory(rates.receiveBytesPerSecond, rates.transmitBytesPerSecond);

  return {
    source: config.hostProcPrefix ? "host" : "container",
    timestamp: new Date(timestamp).toISOString(),
    receiveBytesPerSecond: rates.receiveBytesPerSecond,
    transmitBytesPerSecond: rates.transmitBytesPerSecond,
    receiveHistory: [...receiveHistory],
    transmitHistory: [...transmitHistory],
    interfaces: rates.interfaces,
  };
}

export async function collectProcessStats(
  config: HostStatsConfig,
): Promise<ProcessStatsSnapshot> {
  const processes = await readTopProcesses(config);

  return {
    source: config.hostProcPrefix ? "host" : "container",
    timestamp: new Date().toISOString(),
    processes,
  };
}
