import { registerPlugin } from "./registry.js";
import { loadPluginManifests } from "./load-manifests.js";
import { createOrionClient } from "../connectors/orion/orion-client.js";
import { createMatchdayClient } from "../connectors/matchday/matchday-client.js";
import { createJellyfinClient } from "../connectors/jellyfin/jellyfin-client.js";
import { createImmichClient } from "../connectors/immich/immich-client.js";
import type { Env } from "../config/env.js";

export async function bootstrapPlugins(env: Env): Promise<void> {
  const manifests = await loadPluginManifests();
  const orionClient = createOrionClient({
    baseUrl: env.ORION_URL,
    publicUrl: env.ORION_PUBLIC_URL ?? env.ORION_URL,
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
  const jellyfinClient = createJellyfinClient({
    baseUrl: env.JELLYFIN_URL,
    publicUrl: env.JELLYFIN_PUBLIC_URL ?? env.JELLYFIN_URL,
    apiKey: env.JELLYFIN_API_KEY,
    userId: env.JELLYFIN_USER_ID,
    timeoutMs: env.JELLYFIN_TIMEOUT_MS,
  });
  const immichClient = createImmichClient({
    photos: {
      baseUrl: env.PHOTOS_URL,
      publicUrl: env.PHOTOS_PUBLIC_URL ?? env.PHOTOS_URL,
      apiKey: env.PHOTOS_API_KEY,
    },
    photosShared: {
      baseUrl: env.PHOTOSSHARED_URL,
      publicUrl: env.PHOTOSSHARED_PUBLIC_URL ?? env.PHOTOSSHARED_URL,
      apiKey: env.PHOTOSSHARED_API_KEY,
    },
    timeoutMs: env.IMMICH_TIMEOUT_MS,
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

    if (plugin.id === "jellyfin" && jellyfinClient.isConfigured) {
      registerPlugin({ ...plugin, enabled: true });
      continue;
    }

    if (plugin.id === "immich" && immichClient.isConfigured) {
      registerPlugin({ ...plugin, enabled: true });
      continue;
    }

    registerPlugin(plugin);
  }
}
