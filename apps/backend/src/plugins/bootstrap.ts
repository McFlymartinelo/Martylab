import { registerPlugin } from "./registry.js";
import { loadPluginManifests } from "./load-manifests.js";
import { createOrionClient } from "../connectors/orion/orion-client.js";
import type { Env } from "../config/env.js";

export async function bootstrapPlugins(env: Env): Promise<void> {
  const manifests = await loadPluginManifests();
  const orionClient = createOrionClient({
    baseUrl: env.ORION_URL,
    apiKey: env.ORION_API_KEY,
    timeoutMs: env.ORION_TIMEOUT_MS,
  });

  for (const plugin of manifests) {
    if (plugin.id === "orion" && orionClient.isConfigured) {
      // Do not block HTTP startup on an external Orion health probe.
      // Live status is exposed via GET /api/orion/status.
      registerPlugin({ ...plugin, enabled: true });
      continue;
    }

    registerPlugin(plugin);
  }
}
