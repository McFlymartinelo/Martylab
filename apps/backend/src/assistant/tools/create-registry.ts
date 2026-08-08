import type { SessionUser } from "@martylab/shared";
import type { MatchdayClient } from "../../connectors/matchday/matchday-client.js";
import type { OrionClient } from "../../connectors/orion/orion-client.js";
import type { JellyfinClient } from "../../connectors/jellyfin/jellyfin-client.js";
import type { DockerClient } from "../../connectors/docker/docker-client.js";
import type { PortainerClient } from "../../connectors/portainer/portainer-client.js";
import type { CloudflareClient } from "../../connectors/cloudflare/cloudflare-client.js";
import type { NasClient } from "../../connectors/nas/nas-client.js";
import type { ServerMetricsService } from "../../connectors/server/server-metrics.js";

export interface AssistantToolContext {
  user: SessionUser;
}

export interface AssistantToolCall {
  toolId: string;
  parameters: Record<string, unknown>;
}

export interface AssistantToolExecutionResult {
  success: boolean;
  summary: string;
  data?: Record<string, unknown>;
}

export interface AssistantTool {
  id: string;
  name: string;
  description: string;
  pluginId: string;
  risk: "read" | "low" | "high";
  minRole: "guest" | "user" | "admin";
  requiresConfirmation: boolean;
  parameters: Record<string, unknown>;
  execute(
    context: AssistantToolContext,
    parameters: Record<string, unknown>,
  ): Promise<AssistantToolExecutionResult>;
}

export interface AssistantToolRegistry {
  list(): AssistantTool[];
  get(toolId: string): AssistantTool | undefined;
}

export interface AssistantToolDependencies {
  orionClient: OrionClient;
  matchdayClient: MatchdayClient;
  jellyfinClient: JellyfinClient;
  dockerClient: DockerClient;
  portainerClient: PortainerClient;
  cloudflareClient: CloudflareClient;
  nasClient: NasClient;
  serverMetrics: ServerMetricsService;
}

function jsonSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
): Record<string, unknown> {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

export function createAssistantToolRegistry(
  deps: AssistantToolDependencies,
): AssistantToolRegistry {
  const tools: AssistantTool[] = [
    {
      id: "orion.get_climate",
      name: "Lire le climat Orion",
      description: "Récupère température, humidité et CO₂ intérieurs/extérieurs.",
      pluginId: "orion",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        const climate = await deps.orionClient.getClimate();
        if (!climate.available) {
          return {
            success: false,
            summary: "Le connecteur Orion n'est pas disponible.",
          };
        }

        return {
          success: true,
          summary: `Intérieur : ${climate.indoor.temperatureCelsius ?? "—"} °C, humidité ${climate.indoor.humidityPercent ?? "—"} %, CO₂ ${climate.co2Ppm ?? "—"} ppm. Extérieur : ${climate.outdoor.temperatureCelsius ?? "—"} °C.`,
          data: climate as unknown as Record<string, unknown>,
        };
      },
    },
    {
      id: "orion.list_lights",
      name: "Lister les lumières Orion",
      description: "Liste les lumières Hue connectées via Orion.",
      pluginId: "orion",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        const lights = await deps.orionClient.getLights();
        if (!lights.available) {
          return {
            success: false,
            summary: "Impossible de récupérer les lumières Orion.",
          };
        }

        const summary = lights.lights
          .map(
            (light) =>
              `${light.name} (${light.id}) : ${light.on ? "allumée" : "éteinte"}`,
          )
          .join(" · ");

        return {
          success: true,
          summary: summary || "Aucune lumière trouvée.",
          data: { lights: lights.lights },
        };
      },
    },
    {
      id: "orion.set_light",
      name: "Contrôler une lumière Orion",
      description: "Allume ou éteint une lumière Hue via Orion.",
      pluginId: "orion",
      risk: "low",
      minRole: "user",
      requiresConfirmation: false,
      parameters: jsonSchema(
        {
          lightId: { type: "string", description: "Identifiant de la lumière" },
          on: { type: "boolean", description: "true pour allumer, false pour éteindre" },
        },
        ["lightId", "on"],
      ),
      async execute(_context, parameters) {
        const lightId = String(parameters.lightId ?? "");
        const on = Boolean(parameters.on);

        if (!lightId) {
          return { success: false, summary: "lightId requis." };
        }

        const result = await deps.orionClient.setLightState(lightId, { on });
        return {
          success: result.ok,
          summary: result.ok
            ? `Lumière ${lightId} ${on ? "allumée" : "éteinte"}.`
            : "Échec du contrôle de la lumière.",
          data: result as unknown as Record<string, unknown>,
        };
      },
    },
    {
      id: "matchday.get_summary",
      name: "Résumé Matchday",
      description: "Classement, pronostics en attente et prochains matchs.",
      pluginId: "matchday",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute(context) {
        const summary = await deps.matchdayClient.getSummary({
          martylabUsername: context.user.username,
          martylabDisplayName: context.user.displayName,
        });

        if (!summary.available) {
          return {
            success: false,
            summary: "Matchday n'est pas disponible.",
          };
        }

        return {
          success: true,
          summary: `${summary.groupName ?? "Ligue"} — rang ${summary.userRank ?? "?"}, ${summary.userTotalPoints ?? 0} pts. ${summary.pendingPredictions ?? "—"} prono(s) en attente.`,
          data: summary as unknown as Record<string, unknown>,
        };
      },
    },
    {
      id: "jellyfin.get_summary",
      name: "Résumé Jellyfin",
      description: "Sessions actives, reprise et ajouts récents.",
      pluginId: "jellyfin",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        const summary = await deps.jellyfinClient.getSummary();
        if (!summary.available) {
          return {
            success: false,
            summary: "Jellyfin n'est pas disponible.",
          };
        }

        return {
          success: true,
          summary: `${summary.serverName ?? "Jellyfin"} — ${summary.activeSessions} lecture(s) active(s), ${summary.resumeCount} média(s) à reprendre.`,
          data: summary as unknown as Record<string, unknown>,
        };
      },
    },
    {
      id: "docker.list_containers",
      name: "Lister les conteneurs Docker",
      description: "Liste les conteneurs Docker du serveur.",
      pluginId: "docker",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        if (!deps.dockerClient.isConfigured) {
          return {
            success: false,
            summary: "Le connecteur Docker n'est pas configuré.",
          };
        }

        const containers = await deps.dockerClient.listContainers();
        const summary = containers
          .slice(0, 10)
          .map((container) => `${container.name} (${container.state})`)
          .join(" · ");

        return {
          success: true,
          summary: summary || "Aucun conteneur détecté.",
          data: { containers },
        };
      },
    },
    {
      id: "docker.restart_container",
      name: "Redémarrer un conteneur Docker",
      description: "Redémarre un conteneur Docker par son identifiant.",
      pluginId: "docker",
      risk: "high",
      minRole: "admin",
      requiresConfirmation: true,
      parameters: jsonSchema(
        {
          containerId: {
            type: "string",
            description: "Identifiant du conteneur Docker",
          },
        },
        ["containerId"],
      ),
      async execute(_context, parameters) {
        const containerId = String(parameters.containerId ?? "");
        if (!containerId) {
          return { success: false, summary: "containerId requis." };
        }

        await deps.dockerClient.restartContainer(containerId);
        return {
          success: true,
          summary: `Conteneur ${containerId} redémarré.`,
          data: { containerId },
        };
      },
    },
    {
      id: "system.get_metrics",
      name: "Métriques système",
      description: "CPU, RAM, stockage et uptime du serveur.",
      pluginId: "system",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        const metrics = await deps.serverMetrics.getMetrics();
        return {
          success: true,
          summary: `CPU ${metrics.cpu.usagePercent.toFixed(1)} %, RAM ${metrics.memory.usagePercent.toFixed(1)} %, stockage ${metrics.storage.usagePercent.toFixed(1)} %, uptime ${Math.round(metrics.uptimeSeconds / 3600)} h.`,
          data: metrics as unknown as Record<string, unknown>,
        };
      },
    },
    {
      id: "portainer.get_overview",
      name: "Vue Portainer",
      description: "Résumé des conteneurs, images et volumes Portainer.",
      pluginId: "portainer",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        const overview = await deps.portainerClient.getOverview();
        if (!overview.available) {
          return {
            success: false,
            summary: "Portainer n'est pas disponible.",
          };
        }

        return {
          success: true,
          summary: `${overview.containers.length} conteneur(s), ${overview.images.length} image(s), ${overview.volumes.length} volume(s).`,
          data: overview as unknown as Record<string, unknown>,
        };
      },
    },
    {
      id: "cloudflare.get_status",
      name: "Statut Cloudflare",
      description: "État du tunnel Cloudflare et des domaines surveillés.",
      pluginId: "cloudflare",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        const status = await deps.cloudflareClient.checkStatus();
        if (!status.configured) {
          return {
            success: false,
            summary: "Cloudflare n'est pas configuré.",
          };
        }

        const onlineHostnames = status.hostnames.filter((host) => host.online)
          .length;

        return {
          success: true,
          summary: `Tunnel ${status.tunnelName ?? status.tunnelId ?? "—"} (${status.tunnelStatus ?? "inconnu"}), ${onlineHostnames}/${status.hostnames.length} domaine(s) joignable(s).`,
          data: status as unknown as Record<string, unknown>,
        };
      },
    },
    {
      id: "nas.get_status",
      name: "Statut NAS",
      description: "CPU, RAM, température et pools de stockage du NAS UGREEN.",
      pluginId: "nas",
      risk: "read",
      minRole: "guest",
      requiresConfirmation: false,
      parameters: jsonSchema({}),
      async execute() {
        const status = await deps.nasClient.checkStatus();
        if (!status.configured) {
          return {
            success: false,
            summary: "Le NAS n'est pas configuré.",
          };
        }

        if (!status.online) {
          return {
            success: false,
            summary: "Le NAS est hors ligne.",
          };
        }

        return {
          success: true,
          summary: `${status.deviceName ?? "NAS"} — CPU ${status.cpuUsagePercent ?? "—"} %, RAM ${status.ramUsagePercent ?? "—"} %, ${status.storagePools.length} pool(s).`,
          data: status as unknown as Record<string, unknown>,
        };
      },
    },
  ];

  const byId = new Map(tools.map((tool) => [tool.id, tool]));

  return {
    list: () => tools,
    get: (toolId: string) => byId.get(toolId),
  };
}
