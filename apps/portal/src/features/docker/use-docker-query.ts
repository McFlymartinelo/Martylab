import { useQuery } from "@tanstack/react-query";
import { fetchDockerContainers } from "@/features/docker/docker-api";

export const dockerContainersQueryKey = ["docker", "containers"] as const;

export function useDockerContainersQuery() {
  return useQuery({
    queryKey: dockerContainersQueryKey,
    queryFn: fetchDockerContainers,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
