import { useQuery } from "@tanstack/react-query";
import {
  fetchImmichPage,
  fetchImmichStatus,
  fetchImmichSummary,
} from "@/features/immich/immich-api";

export const immichStatusQueryKey = ["immich", "status"] as const;
export const immichSummaryQueryKey = ["immich", "summary"] as const;
export const immichPageQueryKey = ["immich", "page"] as const;

export function useImmichStatusQuery() {
  return useQuery({
    queryKey: immichStatusQueryKey,
    queryFn: fetchImmichStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useImmichSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: immichSummaryQueryKey,
    queryFn: fetchImmichSummary,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useImmichPageQuery(enabled = true) {
  return useQuery({
    queryKey: immichPageQueryKey,
    queryFn: fetchImmichPage,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
