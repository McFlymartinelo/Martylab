import { useQuery } from "@tanstack/react-query";
import {
  fetchOrionClimate,
  fetchOrionStatus,
} from "@/features/orion/orion-api";

export const orionStatusQueryKey = ["orion", "status"] as const;
export const orionClimateQueryKey = ["orion", "climate"] as const;

export function useOrionStatusQuery() {
  return useQuery({
    queryKey: orionStatusQueryKey,
    queryFn: fetchOrionStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useOrionClimateQuery(enabled = true) {
  return useQuery({
    queryKey: orionClimateQueryKey,
    queryFn: fetchOrionClimate,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
