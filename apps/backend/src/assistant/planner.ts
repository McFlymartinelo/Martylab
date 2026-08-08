import type { AssistantToolCall } from "./tools/create-registry.js";

export function planToolCalls(message: string): AssistantToolCall[] {
  const lower = message.toLowerCase();

  if (
    lower.includes("redémarre") ||
    lower.includes("redemarre") ||
    lower.includes("restart")
  ) {
    const match =
      message.match(/conteneur\s+([a-zA-Z0-9_.-]+)/i) ??
      message.match(/container\s+([a-zA-Z0-9_.-]+)/i);
    if (match?.[1]) {
      return [
        {
          toolId: "docker.restart_container",
          parameters: { containerId: match[1] },
        },
      ];
    }
  }

  if (
    lower.includes("allume") ||
    lower.includes("éteint") ||
    lower.includes("eteint")
  ) {
    const lightMatch = message.match(/lumière\s+(\d+)/i) ?? message.match(/light\s+(\d+)/i);
    if (lightMatch?.[1]) {
      const on = !lower.includes("éteint") && !lower.includes("eteint");
      return [
        {
          toolId: "orion.set_light",
          parameters: { lightId: lightMatch[1], on },
        },
      ];
    }
  }

  if (
    lower.includes("tempér") ||
    lower.includes("temperature") ||
    lower.includes("climat") ||
    lower.includes("co2") ||
    lower.includes("humid")
  ) {
    return [{ toolId: "orion.get_climate", parameters: {} }];
  }

  if (lower.includes("lumière") || lower.includes("lumiere") || lower.includes("hue")) {
    return [{ toolId: "orion.list_lights", parameters: {} }];
  }

  if (
    lower.includes("matchday") ||
    lower.includes("pronostic") ||
    lower.includes("classement") ||
    lower.includes("ligue")
  ) {
    return [{ toolId: "matchday.get_summary", parameters: {} }];
  }

  if (
    lower.includes("jellyfin") ||
    lower.includes("film") ||
    lower.includes("série") ||
    lower.includes("serie") ||
    lower.includes("média") ||
    lower.includes("media")
  ) {
    return [{ toolId: "jellyfin.get_summary", parameters: {} }];
  }

  if (lower.includes("portainer")) {
    return [{ toolId: "portainer.get_overview", parameters: {} }];
  }

  if (
    lower.includes("cloudflare") ||
    lower.includes("tunnel") ||
    lower.includes("domaine")
  ) {
    return [{ toolId: "cloudflare.get_status", parameters: {} }];
  }

  if (lower.includes("nas") || lower.includes("ugreen")) {
    return [{ toolId: "nas.get_status", parameters: {} }];
  }

  if (
    lower.includes("docker") ||
    lower.includes("conteneur") ||
    lower.includes("container")
  ) {
    return [{ toolId: "docker.list_containers", parameters: {} }];
  }

  if (
    lower.includes("cpu") ||
    lower.includes("ram") ||
    lower.includes("stockage") ||
    lower.includes("système") ||
    lower.includes("systeme") ||
    lower.includes("uptime")
  ) {
    return [{ toolId: "system.get_metrics", parameters: {} }];
  }

  return [];
}

export function buildHelpMessage(): string {
  return [
    "Je peux interroger tes services connectés. Exemples :",
    "• « Quelle est la température ? » (Orion)",
    "• « Classement Matchday »",
    "• « État Jellyfin »",
    "• « Conteneurs Docker »",
    "• « Métriques système »",
    "• « Statut NAS / Cloudflare / Portainer »",
    "",
    "Les actions sensibles (ex. redémarrer un conteneur) demandent une confirmation.",
  ].join("\n");
}
