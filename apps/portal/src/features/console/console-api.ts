import type {
  ConsoleAuditResponse,
  ConsoleCommandsResponse,
  ConsoleExecuteRequest,
  ConsoleExecuteResponse,
} from "@martylab/shared";
import { apiGet, apiPost } from "@/lib/api-client";

export function fetchConsoleCommands(): Promise<ConsoleCommandsResponse> {
  return apiGet<ConsoleCommandsResponse>("/api/console/commands");
}

export function executeConsoleCommand(
  body: ConsoleExecuteRequest,
): Promise<ConsoleExecuteResponse> {
  return apiPost<ConsoleExecuteResponse>("/api/console/execute", body);
}

export function fetchConsoleAudit(limit = 40): Promise<ConsoleAuditResponse> {
  return apiGet<ConsoleAuditResponse>(`/api/console/audit?limit=${limit}`);
}
