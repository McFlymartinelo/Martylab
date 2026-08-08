import type {
  OrionClimateResponse,
  OrionLightsResponse,
  OrionSetLightRequest,
  OrionSetLightResponse,
  OrionStatusResponse,
} from "@martylab/shared";
import { apiGet, apiPut } from "@/lib/api-client";

export function fetchOrionStatus(): Promise<OrionStatusResponse> {
  return apiGet<OrionStatusResponse>("/api/orion/status");
}

export function fetchOrionClimate(): Promise<OrionClimateResponse> {
  return apiGet<OrionClimateResponse>("/api/orion/climate");
}

export function fetchOrionLights(): Promise<OrionLightsResponse> {
  return apiGet<OrionLightsResponse>("/api/orion/lights");
}

export function setOrionLight(
  lightId: string,
  body: OrionSetLightRequest,
): Promise<OrionSetLightResponse> {
  return apiPut<OrionSetLightResponse>(
    `/api/orion/lights/${encodeURIComponent(lightId)}`,
    body,
  );
}
