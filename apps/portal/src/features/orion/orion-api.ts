import type { OrionClimateResponse, OrionStatusResponse } from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchOrionStatus(): Promise<OrionStatusResponse> {
  return apiGet<OrionStatusResponse>("/api/orion/status");
}

export function fetchOrionClimate(): Promise<OrionClimateResponse> {
  return apiGet<OrionClimateResponse>("/api/orion/climate");
}
