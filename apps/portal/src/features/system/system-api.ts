import type {
  SystemMetricsResponse,
  SystemNetworkResponse,
  SystemProcessesResponse,
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
