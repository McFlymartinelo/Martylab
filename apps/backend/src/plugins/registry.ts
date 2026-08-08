import type { PluginManifest, PluginsResponse } from "@martylab/shared";

const plugins = new Map<string, PluginManifest>();

export function listPlugins(): PluginsResponse {
  return {
    plugins: Array.from(plugins.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}

export function registerPlugin(plugin: PluginManifest): void {
  plugins.set(plugin.id, plugin);
}

export function clearPlugins(): void {
  plugins.clear();
}
