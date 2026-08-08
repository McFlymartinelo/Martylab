import type { CloudflareStatusResponse } from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchCloudflareStatus(): Promise<CloudflareStatusResponse> {
  return apiGet<CloudflareStatusResponse>("/api/cloudflare/status");
}
