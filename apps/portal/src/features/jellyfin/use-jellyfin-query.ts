import { useQuery } from "@tanstack/react-query";
import {
  fetchJellyfinPage,
  fetchJellyfinStatus,
  fetchJellyfinSummary,
} from "@/features/jellyfin/jellyfin-api";

export const jellyfinStatusQueryKey = ["jellyfin", "status"] as const;
export const jellyfinSummaryQueryKey = ["jellyfin", "summary"] as const;
export const jellyfinPageQueryKey = ["jellyfin", "page"] as const;

export function useJellyfinStatusQuery() {
  return useQuery({
    queryKey: jellyfinStatusQueryKey,
    queryFn: fetchJellyfinStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useJellyfinSummaryQuery(enabled = true) {
  return useQuery({
    queryKey: jellyfinSummaryQueryKey,
    queryFn: fetchJellyfinSummary,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useJellyfinPageQuery(enabled = true) {
  return useQuery({
    queryKey: jellyfinPageQueryKey,
    queryFn: fetchJellyfinPage,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
