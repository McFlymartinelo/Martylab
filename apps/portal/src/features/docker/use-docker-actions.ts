import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DockerContainerAction } from "@martylab/shared";
import {
  fetchDockerContainerLogs,
  runDockerContainerAction,
} from "@/features/docker/docker-actions-api";
import { dockerContainersQueryKey } from "@/features/docker/use-docker-query";

export function useDockerContainerLogsQuery(
  containerId: string | null,
  enabled = false,
) {
  return useQuery({
    queryKey: ["docker", "logs", containerId],
    queryFn: () => fetchDockerContainerLogs(containerId!),
    enabled: enabled && Boolean(containerId),
  });
}

export function useDockerContainerActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      containerId,
      action,
    }: {
      containerId: string;
      action: DockerContainerAction;
    }) => runDockerContainerAction(containerId, action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dockerContainersQueryKey });
    },
  });
}
