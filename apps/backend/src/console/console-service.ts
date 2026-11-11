import type {
  ConsoleCommandDefinition,
  ConsoleExecuteResponse,
  ConsoleRisk,
  DockerContainerSummary,
  SessionUser,
} from "@martylab/shared";
import type { DockerClient } from "../connectors/docker/docker-client.js";
import type { ServerMetricsService } from "../connectors/server/server-metrics.js";
import type { SystemInfoService } from "../connectors/server/server-system-info.js";
import { AppError } from "../lib/errors.js";
import type { Logger } from "../lib/logger.js";
import type { ConsoleRepository } from "./console-repository.js";

/**
 * Console à allowlist : chaque commande est résolue vers un collecteur en
 * lecture seule ou un connecteur existant. Aucun `child_process`, aucun shell
 * hôte, aucun `sudo`. Le terminal conteneur est un canal séparé.
 */

export const CONSOLE_COMMANDS: ConsoleCommandDefinition[] = [
  {
    id: "help",
    usage: "help",
    description: "Liste les commandes autorisées.",
    risk: "read",
  },
  {
    id: "status",
    usage: "status",
    description: "Résumé CPU, RAM, disque et disponibilité.",
    risk: "read",
  },
  {
    id: "containers",
    usage: "containers",
    description: "Liste les conteneurs Docker (alias : docker ps).",
    risk: "read",
  },
  {
    id: "logs",
    usage: "docker logs <conteneur> [--lines N]",
    description: "Dernières lignes de logs d'un conteneur (max 500).",
    risk: "read",
  },
  {
    id: "disk",
    usage: "disk",
    description: "Volumes montés, occupation et inodes (alias : df).",
    risk: "read",
  },
  {
    id: "network",
    usage: "network",
    description: "Interfaces réseau et débits instantanés.",
    risk: "read",
  },
  {
    id: "processes",
    usage: "processes [--limit N]",
    description: "Processus les plus gourmands en mémoire (alias : ps).",
    risk: "read",
  },
  {
    id: "hardware",
    usage: "hardware",
    description: "Capteurs de température et ventilateurs.",
    risk: "read",
  },
  {
    id: "uname",
    usage: "uname",
    description: "Hôte, système, noyau, architecture et CPU.",
    risk: "read",
  },
  {
    id: "uptime",
    usage: "uptime",
    description: "Disponibilité du serveur.",
    risk: "read",
  },
  {
    id: "audit",
    usage: "audit [--limit N]",
    description: "Dernières entrées du journal d'audit de la console.",
    risk: "read",
  },
  {
    id: "docker-start",
    usage: "docker start <conteneur>",
    description: "Démarre un conteneur (confirmation explicite).",
    risk: "write",
  },
  {
    id: "docker-stop",
    usage: "docker stop <conteneur>",
    description: "Arrête un conteneur (confirmation explicite).",
    risk: "destructive",
  },
  {
    id: "docker-restart",
    usage: "docker restart <conteneur>",
    description: "Redémarre un conteneur (confirmation explicite).",
    risk: "destructive",
  },
];

const DEFINITIONS = new Map(CONSOLE_COMMANDS.map((entry) => [entry.id, entry]));

type ParsedCommand = {
  id: string;
  definition: ConsoleCommandDefinition;
  args: string[];
};

const MAX_INPUT_LENGTH = 200;

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (const char of input.trim()) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (quote) {
    throw new AppError(400, "invalid_command", "Guillemet non fermé.");
  }
  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function parse(input: string): ParsedCommand {
  const tokens = tokenize(input);
  if (tokens.length === 0) {
    throw new AppError(400, "empty_command", "Saisis une commande.");
  }

  const [first, second] = tokens;
  const rest = tokens.slice(1);

  const build = (id: string, args: string[]): ParsedCommand => {
    const definition = DEFINITIONS.get(id);
    if (!definition) {
      throw new AppError(400, "unknown_command", "Commande inconnue.");
    }
    return { id, definition, args };
  };

  if (first === "martylab" && second === "status") {
    return build("status", tokens.slice(2));
  }

  switch (first) {
    case "help":
      return build("help", rest);
    case "status":
    case "uptime":
    case "network":
    case "hardware":
    case "uname":
    case "audit":
      return build(first, rest);
    case "containers":
    case "disk":
    case "processes":
      return build(first, rest);
    case "df":
      return build("disk", rest.filter((arg) => arg !== "-h"));
    case "ps":
      return build("processes", rest);
    case "docker": {
      if (second === "ps") {
        return build("containers", tokens.slice(2));
      }
      if (second === "logs") {
        return build("logs", tokens.slice(2));
      }
      if (
        second === "start" ||
        second === "stop" ||
        second === "restart"
      ) {
        return build(`docker-${second}`, tokens.slice(2));
      }
      throw new AppError(
        400,
        "unknown_command",
        "Sous-commande docker inconnue. Utilise help.",
      );
    }
    default:
      throw new AppError(
        400,
        "unknown_command",
        `Commande « ${first} » non autorisée. Utilise help.`,
      );
  }
}

function parseLimit(
  args: string[],
  fallback: number,
  max: number,
  flags: string[] = ["--limit", "-n"],
): { limit: number; rest: string[] } {
  const index = args.findIndex((arg) => flags.includes(arg));
  if (index === -1) {
    return { limit: fallback, rest: args };
  }

  const raw = args[index + 1];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, "invalid_argument", "--limit attend un entier.");
  }

  return {
    limit: Math.min(parsed, max),
    rest: [...args.slice(0, index), ...args.slice(index + 2)],
  };
}

function stringArg(args: string[], label: string): string {
  const [value, ...extra] = args;
  if (!value) {
    throw new AppError(400, "missing_argument", `Argument manquant : ${label}.`);
  }
  if (extra.length > 0) {
    throw new AppError(400, "invalid_argument", "Trop d'arguments.");
  }
  return value;
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value.padEnd(width, " ");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 o";
  }
  const units = ["o", "Ko", "Mo", "Go", "To", "Po"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days} j ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

/** /proc absent (Windows ou conteneur sans HOST_PROC_PREFIX). */
function isProcUnavailable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function findContainer(
  containers: DockerContainerSummary[],
  reference: string,
): DockerContainerSummary {
  const container = containers.find(
    (entry) =>
      entry.name === reference ||
      entry.id === reference ||
      entry.id.startsWith(reference),
  );

  if (!container) {
    throw new AppError(
      404,
      "container_not_found",
      `Conteneur introuvable : ${reference}.`,
    );
  }

  return container;
}

interface ConsoleServiceDeps {
  dockerClient: DockerClient;
  serverMetrics: ServerMetricsService;
  systemInfo: SystemInfoService;
  repository: ConsoleRepository;
  logger: Logger;
  terminalEnabled: boolean;
}

export function createConsoleService(deps: ConsoleServiceDeps) {
  const { repository, logger } = deps;

  async function audit(
    actor: SessionUser,
    command: string,
    status: "success" | "error" | "refused" | "pending_confirmation",
    risk: string,
    outputPreview?: string | null,
    durationMs?: number | null,
  ): Promise<void> {
    try {
      await repository.record({
        userId: actor.id,
        username: actor.username,
        command,
        status,
        risk,
        outputPreview: outputPreview ?? null,
        durationMs: durationMs ?? null,
      });
    } catch (error) {
      // L'audit ne doit jamais masquer le résultat de la commande, mais
      // l'échec est tracé : un journal manquant est un incident de sécurité.
      logger.error({ err: error }, "Unable to write console audit entry");
    }
  }

  async function requireDocker() {
    if (!deps.dockerClient.isConfigured) {
      throw new AppError(
        503,
        "docker_unavailable",
        "Le connecteur Docker n'est pas configuré.",
      );
    }
    return deps.dockerClient;
  }

  async function run(parsed: ParsedCommand, actor: SessionUser): Promise<string> {
    switch (parsed.id) {
      case "help":
        return [
          "Commandes autorisées :",
          ...CONSOLE_COMMANDS.map(
            (entry) =>
              `  ${pad(entry.usage, 40)} ${entry.description}${entry.risk === "read" ? "" : " [confirmation]"}`,
          ),
          "",
          "Le terminal conteneur est disponible dans l'onglet Terminal (admin).",
        ].join("\n");

      case "status": {
        const metrics = await deps.serverMetrics.getMetrics();
        return [
          `Source       : ${metrics.source === "host" ? "hôte" : "conteneur"}`,
          `Disponibilité: ${formatUptime(metrics.uptimeSeconds)}`,
          `CPU          : ${formatPercent(metrics.cpu.usagePercent)} (${metrics.cpu.cores} cœurs)`,
          `RAM          : ${formatPercent(metrics.memory.usagePercent)} (${formatBytes(metrics.memory.usedBytes)} / ${formatBytes(metrics.memory.totalBytes)})`,
          `Disque       : ${formatPercent(metrics.storage.usagePercent)} (${formatBytes(metrics.storage.usedBytes)} / ${formatBytes(metrics.storage.totalBytes)} · ${metrics.storage.path})`,
        ].join("\n");
      }

      case "containers": {
        const docker = await requireDocker();
        const containers = await docker.listContainers();
        if (containers.length === 0) {
          return "Aucun conteneur détecté.";
        }
        const rows = [
          `${pad("NOM", 32)} ${pad("ÉTAT", 12)} IMAGE`,
          ...containers.map(
            (entry) =>
              `${pad(entry.name, 32)} ${pad(entry.state, 12)} ${entry.image}`,
          ),
        ];
        return rows.join("\n");
      }

      case "logs": {
        const { limit, rest } = parseLimit(parsed.args, 100, 500, [
          "--lines",
          "--limit",
          "-n",
        ]);
        const reference = stringArg(rest, "conteneur");
        const docker = await requireDocker();
        const containers = await docker.listContainers();
        const container = findContainer(containers, reference);
        const logs = await docker.getContainerLogs(container.id, limit);
        return `Logs de ${container.name} (${limit} dernières lignes) :\n\n${logs || "(vide)"}`;
      }

      case "disk": {
        const storage = await deps.systemInfo.getStorage();
        if (storage.mounts.length === 0) {
          return "Aucun volume exploitable remonté.";
        }
        return [
          `${pad("POINT", 24)} ${pad("USAGE", 8)} OCCUPÉ / TOTAL`,
          ...storage.mounts.map(
            (mount) =>
              `${pad(mount.mountPoint, 24)} ${pad(formatPercent(mount.usagePercent), 8)} ${formatBytes(mount.usedBytes)} / ${formatBytes(mount.totalBytes)} (${mount.fileSystem})`,
          ),
        ].join("\n");
      }

      case "network": {
        const network = await deps.serverMetrics.getNetworkStats();
        if (network.interfaces.length === 0) {
          return "Aucune interface réseau détectée.";
        }
        return [
          `Total : ${formatBytes(network.receiveBytesPerSecond)}/s entrant · ${formatBytes(network.transmitBytesPerSecond)}/s sortant`,
          "",
          `${pad("INTERFACE", 16)} ${pad("ÉTAT", 8)} ${pad("REÇU", 12)} ENVOYÉ`,
          ...network.interfaces.map(
            (iface) =>
              `${pad(iface.name, 16)} ${pad(iface.operState ?? "?", 8)} ${pad(`${formatBytes(iface.receiveBytesPerSecond)}/s`, 12)} ${formatBytes(iface.transmitBytesPerSecond)}/s`,
          ),
        ].join("\n");
      }

      case "processes": {
        const { limit } = parseLimit(parsed.args, 12, 50);
        const processes = await deps.serverMetrics.getProcessStats();
        return [
          `${pad("PID", 8)} ${pad("NOM", 24)} ${pad("MEM", 10)} ÉTAT`,
          ...processes.processes.slice(0, limit).map(
            (entry) =>
              `${pad(String(entry.pid), 8)} ${pad(entry.name, 24)} ${pad(formatPercent(entry.memoryPercent), 10)} ${entry.state}`,
          ),
        ].join("\n");
      }

      case "hardware": {
        const hardware = await deps.systemInfo.getHardware();
        const lines: string[] = [];
        if (hardware.sensors.length > 0) {
          lines.push("Capteurs :");
          for (const sensor of hardware.sensors) {
            lines.push(`  ${pad(sensor.label, 32)} ${sensor.celsius.toFixed(1)} °C`);
          }
        }
        if (hardware.fans.length > 0) {
          lines.push("Ventilateurs :");
          for (const fan of hardware.fans) {
            lines.push(`  ${pad(fan.label, 32)} ${fan.rpm} tr/min`);
          }
        }
        return lines.length > 0
          ? lines.join("\n")
          : "Aucun capteur disponible (montage /sys absent ou non supporté).";
      }

      case "uname": {
        const overview = await deps.systemInfo.getOverview();
        const facts = overview.facts;
        return [
          `Hôte         : ${facts.hostname ?? "—"}`,
          `Système      : ${facts.os ?? "—"}`,
          `Noyau        : ${facts.kernel ?? "—"}`,
          `Architecture : ${facts.architecture ?? "—"}`,
          `CPU          : ${facts.cpuModel ?? "—"}`,
          `Démarrage    : ${facts.bootTime ?? "—"}`,
        ].join("\n");
      }

      case "uptime": {
        const metrics = await deps.serverMetrics.getMetrics();
        return `Disponibilité : ${formatUptime(metrics.uptimeSeconds)}`;
      }

      case "audit": {
        const { limit } = parseLimit(parsed.args, 20, 100);
        const entries = await repository.list(limit);
        if (entries.length === 0) {
          return "Journal d'audit vide.";
        }
        return entries
          .map(
            (entry) =>
              `${entry.createdAt}  ${pad(entry.username, 16)} ${pad(entry.status, 20)} ${entry.command}`,
          )
          .join("\n");
      }

      case "docker-start":
      case "docker-stop":
      case "docker-restart": {
        const reference = stringArg(parsed.args, "conteneur");
        const docker = await requireDocker();
        const containers = await docker.listContainers();
        const container = findContainer(containers, reference);

        if (parsed.id === "docker-start") {
          await docker.startContainer(container.id);
        } else if (parsed.id === "docker-stop") {
          await docker.stopContainer(container.id);
        } else {
          await docker.restartContainer(container.id);
        }

        const verb =
          parsed.id === "docker-start"
            ? "démarré"
            : parsed.id === "docker-stop"
              ? "arrêté"
              : "redémarré";
        return `Conteneur ${container.name} ${verb}.`;
      }

      default:
        throw new AppError(400, "unknown_command", "Commande non implémentée.");
    }
  }

  return {
    listCommands(): ConsoleCommandDefinition[] {
      return CONSOLE_COMMANDS;
    },

    isTerminalEnabled(): boolean {
      return deps.terminalEnabled;
    },

    async execute(
      actor: SessionUser,
      input: string,
      confirm: boolean,
    ): Promise<ConsoleExecuteResponse> {
      const raw = input.trim();
      if (raw.length === 0) {
        throw new AppError(400, "empty_command", "Saisis une commande.");
      }
      if (raw.length > MAX_INPUT_LENGTH) {
        throw new AppError(
          400,
          "command_too_long",
          `Commande limitée à ${MAX_INPUT_LENGTH} caractères.`,
        );
      }

      let parsed: ParsedCommand;
      try {
        parsed = parse(raw);
      } catch (error) {
        await audit(actor, raw, "refused", "unknown");
        throw error;
      }

      const { definition } = parsed;
      if (definition.risk !== "read" && !confirm) {
        await audit(actor, raw, "pending_confirmation", definition.risk);
        throw new AppError(
          428,
          "confirmation_required",
          `« ${definition.usage} » nécessite une confirmation explicite.`,
        );
      }

      const startedAt = Date.now();
      try {
        const output = await run(parsed, actor);
        const durationMs = Date.now() - startedAt;
        // Les logs d'un conteneur peuvent contenir des jetons ou des URLs
        // sensibles : on journalise le fait, jamais le contenu brut.
        const preview =
          parsed.id === "logs"
            ? "Sortie de logs non conservée dans l'audit."
            : output;
        await audit(
          actor,
          raw,
          "success",
          definition.risk,
          preview,
          durationMs,
        );
        return {
          command: raw,
          risk: definition.risk as ConsoleRisk,
          output,
          auditedAt: new Date().toISOString(),
        };
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        await audit(
          actor,
          raw,
          "error",
          definition.risk,
          error instanceof Error ? error.message : String(error),
          durationMs,
        );
        if (error instanceof AppError) {
          throw error;
        }
        if (isProcUnavailable(error)) {
          throw new AppError(
            503,
            "metrics_unavailable",
            "Les métriques hôte nécessitent Linux (/proc).",
            { cause: error },
          );
        }
        throw new AppError(
          502,
          "command_failed",
          "La commande a échoué côté serveur.",
          { cause: error, isOperational: false },
        );
      }
    },

    async listAudit(limit?: number) {
      return repository.list(limit);
    },
  };
}

export type ConsoleService = ReturnType<typeof createConsoleService>;
