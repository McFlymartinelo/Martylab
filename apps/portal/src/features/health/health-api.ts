import type { HealthResponse } from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/api/health");
}
