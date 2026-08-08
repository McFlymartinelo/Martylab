export interface NasStoragePool {
  name: string;
  label: string | null;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
  status: string | null;
}

export interface NasDiskSummary {
  label: string;
  temperatureCelsius: number | null;
  status: string | null;
}

export interface NasStatusResponse {
  configured: boolean;
  online: boolean;
  deviceName: string | null;
  cpuUsagePercent: number | null;
  ramUsagePercent: number | null;
  cpuTemperatureCelsius: number | null;
  storagePools: NasStoragePool[];
  disks: NasDiskSummary[];
}
