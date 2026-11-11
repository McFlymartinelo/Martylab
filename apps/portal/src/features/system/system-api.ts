import type {
  SystemHardwareResponse,
  SystemMetricsResponse,
  SystemNetworkResponse,
  SystemOverviewResponse,
  SystemProcessesResponse,
  SystemStorageResponse,
} from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchSystemMetrics(): Promise<SystemMetricsResponse> {
  return apiGet<SystemMetricsResponse>("/api/system/metrics");
}

export function fetchSystemNetwork(): Promise<SystemNetworkResponse> {
  return apiGet<SystemNetworkResponse>("/api/system/network");
}

export function fetchSystemProcesses(): Promise<SystemProcessesResponse> {
  return apiGet<SystemProcessesResponse>("/api/system/processes");
}

export function fetchSystemOverview(): Promise<SystemOverviewResponse> {
  return apiGet<SystemOverviewResponse>("/api/system/overview");
}

export function fetchSystemStorage(): Promise<SystemStorageResponse> {
  return apiGet<SystemStorageResponse>("/api/system/storage");
}

export function fetchSystemHardware(): Promise<SystemHardwareResponse> {
  return apiGet<SystemHardwareResponse>("/api/system/hardware");
}
