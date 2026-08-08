import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@/features/health/health-api";

export const healthQueryKey = ["health"] as const;

export function useHealthQuery() {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: fetchHealth,
  });
}
