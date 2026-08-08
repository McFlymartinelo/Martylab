import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { PluginManifest } from "@martylab/shared";

const pluginCapabilitySchema = z.enum([
  "dashboard",
  "actions",
  "notifications",
  "health",
]);

const pluginManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  capabilities: z.array(pluginCapabilitySchema).min(1),
  enabled: z.boolean(),
});

function resolvePluginsDir(): string {
  if (process.env.PLUGINS_DIR) {
    return process.env.PLUGINS_DIR;
  }

  const rootDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../",
  );
  return path.join(rootDir, "plugins");
}

export async function loadPluginManifests(): Promise<PluginManifest[]> {
  const pluginsDir = resolvePluginsDir();

  let entries: string[];
  try {
    entries = await fs.readdir(pluginsDir);
  } catch {
    return [];
  }

  const manifests: PluginManifest[] = [];

  for (const entry of entries) {
    const manifestPath = path.join(pluginsDir, entry, "manifest.json");
    try {
      const raw = await fs.readFile(manifestPath, "utf8");
      const parsed = pluginManifestSchema.parse(JSON.parse(raw));
      manifests.push(parsed);
    } catch {
      // Skip invalid or missing manifests.
    }
  }

  return manifests.sort((a, b) => a.name.localeCompare(b.name));
}
