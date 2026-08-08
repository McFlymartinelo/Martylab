import type { NasStatusResponse } from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchNasStatus(): Promise<NasStatusResponse> {
  return apiGet<NasStatusResponse>("/api/nas/status");
}
