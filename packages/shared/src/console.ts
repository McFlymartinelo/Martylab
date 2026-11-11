/**
 * Contrat de la Console (allowlist typée + terminal conteneur).
 *
 * La console n'exécute jamais de shell libre côté hôte : chaque commande
 * autorisée est résolue par le backend vers un collecteur ou un connecteur
 * existant. Le terminal, lui, ouvre un `exec` Docker dans un conteneur
 * explicitement choisi par un administrateur.
 */

export type ConsoleRisk = "read" | "write" | "destructive";

export type ConsoleAuditStatus =
  | "success"
  | "error"
  | "refused"
  | "pending_confirmation";

export interface ConsoleCommandDefinition {
  id: string;
  usage: string;
  description: string;
  risk: ConsoleRisk;
}

export interface ConsoleCommandsResponse {
  commands: ConsoleCommandDefinition[];
  /** Le terminal conteneur est-il activé sur ce serveur ? */
  terminalEnabled: boolean;
}

export interface ConsoleExecuteRequest {
  input: string;
  /** Confirmation explicite requise pour les commandes non read-only. */
  confirm?: boolean;
}

export interface ConsoleExecuteResponse {
  command: string;
  risk: ConsoleRisk;
  output: string;
  auditedAt: string;
}

export interface ConsoleAuditEntry {
  id: string;
  username: string;
  command: string;
  status: ConsoleAuditStatus;
  risk: string;
  outputPreview: string | null;
  createdAt: string;
}

export interface ConsoleAuditResponse {
  entries: ConsoleAuditEntry[];
}

export interface ConsoleTerminalSessionRequest {
  containerId: string;
  shell?: string;
  cols?: number;
  rows?: number;
}

/** Messages échangés sur le WebSocket du terminal conteneur. */
export type ConsoleTerminalClientMessage =
  | { type: "input"; data: string }
  | { type: "resize"; cols: number; rows: number };

export type ConsoleTerminalServerMessage =
  | { type: "ready"; container: string }
  | { type: "output"; data: string }
  | { type: "exit"; code: number | null }
  | { type: "error"; message: string };
