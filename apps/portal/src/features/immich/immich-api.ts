import type {
  ImmichPageResponse,
  ImmichStatusResponse,
  ImmichSummaryResponse,
} from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchImmichStatus(): Promise<ImmichStatusResponse> {
  return apiGet<ImmichStatusResponse>("/api/immich/status");
}

export function fetchImmichSummary(): Promise<ImmichSummaryResponse> {
  return apiGet<ImmichSummaryResponse>("/api/immich/summary");
}

export function fetchImmichPage(): Promise<ImmichPageResponse> {
  return apiGet<ImmichPageResponse>("/api/immich/page");
}
