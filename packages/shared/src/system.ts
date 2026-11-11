export interface SystemHostFacts {
  hostname: string | null;
  os: string | null;
  kernel: string | null;
  architecture: string | null;
  bootTime: string | null;
  cpuModel: string | null;
  governor: string | null;
}

export interface SystemLoadAverage {
  one: number;
  five: number;
  fifteen: number;
  runningProcesses: number;
  totalProcesses: number;
}

export interface SystemSwapUsage {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
}

export interface SystemOverviewResponse {
  source: "host" | "container";
  timestamp: string;
  facts: SystemHostFacts;
  load: SystemLoadAverage | null;
  swap: SystemSwapUsage | null;
}

export interface SystemMountEntry {
  mountPoint: string;
  device: string;
  fileSystem: string;
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercent: number;
  inodeUsagePercent: number | null;
}

export interface SystemDiskIoEntry {
  device: string;
  readBytesPerSecond: number;
  writeBytesPerSecond: number;
  readOperationsPerSecond: number;
  writeOperationsPerSecond: number;
}

export interface SystemRaidEntry {
  name: string;
  level: string;
  state: string;
  activeDevices: number;
  totalDevices: number;
}

export interface SystemStorageResponse {
  source: "host" | "container";
  timestamp: string;
  mounts: SystemMountEntry[];
  diskIo: SystemDiskIoEntry[];
  raid: SystemRaidEntry[];
}

export interface SystemSensorEntry {
  label: string;
  celsius: number;
}

export interface SystemFanEntry {
  label: string;
  rpm: number;
}

export interface SystemHardwareResponse {
  source: "host" | "container";
  timestamp: string;
  facts: SystemHostFacts;
  cpuCores: number;
  sensors: SystemSensorEntry[];
  fans: SystemFanEntry[];
}
