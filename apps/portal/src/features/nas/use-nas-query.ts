import { useQuery } from "@tanstack/react-query";
import { fetchNasStatus } from "@/features/nas/nas-api";

export const nasStatusQueryKey = ["nas", "status"] as const;

export function useNasStatusQuery() {
  return useQuery({
    queryKey: nasStatusQueryKey,
    queryFn: fetchNasStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
