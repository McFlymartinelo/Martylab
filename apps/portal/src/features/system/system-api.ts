import type { SystemMetricsResponse } from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchSystemMetrics(): Promise<SystemMetricsResponse> {
  return apiGet<SystemMetricsResponse>("/api/system/metrics");
}
