import { useQuery } from "@tanstack/react-query";
import {
  fetchMatchdayStatus,
  fetchMatchdaySummary,
} from "@/features/matchday/matchday-api";

export const matchdayStatusQueryKey = ["matchday", "status"] as const;
export const matchdaySummaryQueryKey = ["matchday", "summary"] as const;

export function useMatchdayStatusQuery() {
  return useQuery({
    queryKey: matchdayStatusQueryKey,
    queryFn: fetchMatchdayStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMatchdaySummaryQuery(enabled = true) {
  return useQuery({
    queryKey: matchdaySummaryQueryKey,
    queryFn: fetchMatchdaySummary,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
