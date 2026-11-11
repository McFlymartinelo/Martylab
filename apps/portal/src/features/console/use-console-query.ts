import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConsoleExecuteRequest } from "@martylab/shared";
import {
  executeConsoleCommand,
  fetchConsoleAudit,
  fetchConsoleCommands,
} from "@/features/console/console-api";

export const consoleCommandsQueryKey = ["console", "commands"] as const;
export const consoleAuditQueryKey = ["console", "audit"] as const;

export function useConsoleCommandsQuery() {
  return useQuery({
    queryKey: consoleCommandsQueryKey,
    queryFn: fetchConsoleCommands,
    staleTime: 5 * 60_000,
  });
}

export function useConsoleAuditQuery(enabled = true) {
  return useQuery({
    queryKey: consoleAuditQueryKey,
    queryFn: () => fetchConsoleAudit(40),
    enabled,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useConsoleExecuteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ConsoleExecuteRequest) => executeConsoleCommand(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: consoleAuditQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["docker", "containers"] });
    },
  });
}
