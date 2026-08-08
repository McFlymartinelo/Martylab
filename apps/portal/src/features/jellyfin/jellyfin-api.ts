import type {
  JellyfinPageResponse,
  JellyfinStatusResponse,
  JellyfinSummaryResponse,
} from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchJellyfinStatus(): Promise<JellyfinStatusResponse> {
  return apiGet<JellyfinStatusResponse>("/api/jellyfin/status");
}

export function fetchJellyfinSummary(): Promise<JellyfinSummaryResponse> {
  return apiGet<JellyfinSummaryResponse>("/api/jellyfin/summary");
}

export function fetchJellyfinPage(): Promise<JellyfinPageResponse> {
  return apiGet<JellyfinPageResponse>("/api/jellyfin/page");
}
