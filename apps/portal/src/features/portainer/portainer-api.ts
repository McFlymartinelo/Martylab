import type {
  PortainerOverviewResponse,
  PortainerStatusResponse,
} from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchPortainerStatus(): Promise<PortainerStatusResponse> {
  return apiGet<PortainerStatusResponse>("/api/portainer/status");
}

export function fetchPortainerOverview(): Promise<PortainerOverviewResponse> {
  return apiGet<PortainerOverviewResponse>("/api/portainer/overview");
}
