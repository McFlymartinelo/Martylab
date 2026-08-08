import { useQuery } from "@tanstack/react-query";
import { fetchCloudflareStatus } from "@/features/cloudflare/cloudflare-api";

export const cloudflareStatusQueryKey = ["cloudflare", "status"] as const;

export function useCloudflareStatusQuery() {
  return useQuery({
    queryKey: cloudflareStatusQueryKey,
    queryFn: fetchCloudflareStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
