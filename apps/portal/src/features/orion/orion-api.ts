import type {
  OrionClimateHistoryResponse,
  OrionClimateResponse,
  OrionClimateMetric,
  OrionClimateRange,
  OrionLightsResponse,
  OrionNotificationsResponse,
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

export function fetchOrionClimateHistory(input: {
  range: OrionClimateRange;
  metric: OrionClimateMetric;
}): Promise<OrionClimateHistoryResponse> {
  const params = new URLSearchParams({
    range: input.range,
    metric: input.metric,
  });
  return apiGet<OrionClimateHistoryResponse>(
    `/api/orion/climate/history?${params.toString()}`,
  );
}

export function fetchOrionNotifications(): Promise<OrionNotificationsResponse> {
  return apiGet<OrionNotificationsResponse>("/api/orion/notifications");
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
