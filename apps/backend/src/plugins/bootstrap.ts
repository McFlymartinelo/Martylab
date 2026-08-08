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
      const online = await orionClient.checkHealth();
      registerPlugin({ ...plugin, enabled: online });
      continue;
    }

    registerPlugin(plugin);
  }
}
