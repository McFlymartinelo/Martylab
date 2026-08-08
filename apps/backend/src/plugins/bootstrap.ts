import type { PluginManifest } from "@martylab/shared";
import { registerPlugin } from "./registry.js";

const builtinPlugins: PluginManifest[] = [
  {
    id: "orion",
    name: "Orion",
    version: "0.0.0",
    capabilities: ["dashboard", "health", "actions"],
    enabled: false,
  },
  {
    id: "matchday",
    name: "Matchday",
    version: "0.0.0",
    capabilities: ["dashboard", "notifications"],
    enabled: false,
  },
];

export function bootstrapPlugins(): void {
  for (const plugin of builtinPlugins) {
    registerPlugin(plugin);
  }
}
