import { useQuery } from "@tanstack/react-query";
import {
  fetchPortainerOverview,
  fetchPortainerStatus,
} from "@/features/portainer/portainer-api";

export const portainerStatusQueryKey = ["portainer", "status"] as const;
export const portainerOverviewQueryKey = ["portainer", "overview"] as const;

export function usePortainerStatusQuery() {
  return useQuery({
    queryKey: portainerStatusQueryKey,
    queryFn: fetchPortainerStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function usePortainerOverviewQuery(enabled = true) {
  return useQuery({
    queryKey: portainerOverviewQueryKey,
    queryFn: fetchPortainerOverview,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
