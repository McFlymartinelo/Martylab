import { useQuery } from "@tanstack/react-query";
import {
  fetchSystemHardware,
  fetchSystemMetrics,
  fetchSystemNetwork,
  fetchSystemOverview,
  fetchSystemProcesses,
  fetchSystemStorage,
} from "@/features/system/system-api";

export const systemMetricsQueryKey = ["system", "metrics"] as const;
export const systemNetworkQueryKey = ["system", "network"] as const;
export const systemProcessesQueryKey = ["system", "processes"] as const;
export const systemOverviewQueryKey = ["system", "overview"] as const;
export const systemStorageQueryKey = ["system", "storage"] as const;
export const systemHardwareQueryKey = ["system", "hardware"] as const;

const systemQueryOptions = {
  refetchInterval: 30_000,
  staleTime: 15_000,
} as const;

const slowSystemQueryOptions = {
  refetchInterval: 60_000,
  staleTime: 30_000,
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

export function useSystemOverviewQuery() {
  return useQuery({
    queryKey: systemOverviewQueryKey,
    queryFn: fetchSystemOverview,
    ...slowSystemQueryOptions,
  });
}

export function useSystemStorageQuery() {
  return useQuery({
    queryKey: systemStorageQueryKey,
    queryFn: fetchSystemStorage,
    ...slowSystemQueryOptions,
  });
}

export function useSystemHardwareQuery() {
  return useQuery({
    queryKey: systemHardwareQueryKey,
    queryFn: fetchSystemHardware,
    ...slowSystemQueryOptions,
  });
}
