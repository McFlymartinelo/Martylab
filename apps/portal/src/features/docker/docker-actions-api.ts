import type {
  DockerContainerAction,
  DockerContainerLogsResponse,
} from "@martylab/shared";
import { apiGet, apiPostVoid } from "@/lib/api-client";

export function fetchDockerContainerLogs(
  containerId: string,
  tail = 100,
): Promise<DockerContainerLogsResponse> {
  return apiGet<DockerContainerLogsResponse>(
    `/api/docker/containers/${containerId}/logs?tail=${tail}`,
  );
}

export function runDockerContainerAction(
  containerId: string,
  action: DockerContainerAction,
): Promise<void> {
  return apiPostVoid(`/api/docker/containers/${containerId}/${action}`);
}
