import { useQuery } from "@tanstack/react-query";
import { fetchSystemMetrics } from "@/features/system/system-api";

export const systemMetricsQueryKey = ["system", "metrics"] as const;

export function useSystemMetricsQuery() {
  return useQuery({
    queryKey: systemMetricsQueryKey,
    queryFn: fetchSystemMetrics,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
