import { useQuery } from "@tanstack/react-query";
import {
  fetchSystemMetrics,
  fetchSystemNetwork,
  fetchSystemProcesses,
} from "@/features/system/system-api";

export const systemMetricsQueryKey = ["system", "metrics"] as const;
export const systemNetworkQueryKey = ["system", "network"] as const;
export const systemProcessesQueryKey = ["system", "processes"] as const;

const systemQueryOptions = {
  refetchInterval: 30_000,
  staleTime: 15_000,
} as const;

export function useSystemMetricsQuery() {
  return useQuery({
    queryKey: systemMetricsQueryKey,
    queryFn: fetchSystemMetrics,
    ...systemQueryOptions,
  });
}

export function useSystemNetworkQuery(enabled = true) {
  return useQuery({
    queryKey: systemNetworkQueryKey,
    queryFn: fetchSystemNetwork,
    enabled,
    ...systemQueryOptions,
  });
}

export function useSystemProcessesQuery(enabled = true) {
  return useQuery({
    queryKey: systemProcessesQueryKey,
    queryFn: fetchSystemProcesses,
    enabled,
    ...systemQueryOptions,
  });
}
