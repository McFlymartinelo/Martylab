import { registerPlugin } from "./registry.js";
import { loadPluginManifests } from "./load-manifests.js";
import { createOrionClient } from "../connectors/orion/orion-client.js";
import { createMatchdayClient } from "../connectors/matchday/matchday-client.js";
import type { Env } from "../config/env.js";

export async function bootstrapPlugins(env: Env): Promise<void> {
  const manifests = await loadPluginManifests();
  const orionClient = createOrionClient({
    baseUrl: env.ORION_URL,
    apiKey: env.ORION_API_KEY,
    timeoutMs: env.ORION_TIMEOUT_MS,
  });
  const matchdayClient = createMatchdayClient({
    baseUrl: env.MATCHDAY_URL,
    publicUrl: env.MATCHDAY_PUBLIC_URL ?? env.MATCHDAY_URL,
    groupId: env.MATCHDAY_GROUP_ID,
    serviceUsername: env.MATCHDAY_SERVICE_USERNAME,
    servicePassword: env.MATCHDAY_SERVICE_PASSWORD,
    userPasswordsJson: env.MATCHDAY_USER_PASSWORDS,
    timeoutMs: env.MATCHDAY_TIMEOUT_MS,
  });

  for (const plugin of manifests) {
    if (plugin.id === "orion" && orionClient.isConfigured) {
      // Do not block HTTP startup on an external Orion health probe.
      // Live status is exposed via GET /api/orion/status.
      registerPlugin({ ...plugin, enabled: true });
      continue;
    }

    if (plugin.id === "matchday" && matchdayClient.isConfigured) {
      registerPlugin({ ...plugin, enabled: true });
      continue;
    }

    registerPlugin(plugin);
  }
}
