import { registerPlugin } from "./registry.js";
import { loadPluginManifests } from "./load-manifests.js";

export async function bootstrapPlugins(): Promise<void> {
  const manifests = await loadPluginManifests();

  for (const plugin of manifests) {
    registerPlugin(plugin);
  }
}
