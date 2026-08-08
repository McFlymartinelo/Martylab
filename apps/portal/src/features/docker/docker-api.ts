import type { DockerContainersResponse } from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchDockerContainers(): Promise<DockerContainersResponse> {
  return apiGet<DockerContainersResponse>("/api/docker/containers");
}
