import type { PluginsResponse } from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchPlugins(): Promise<PluginsResponse> {
  return apiGet<PluginsResponse>("/api/plugins");
}
