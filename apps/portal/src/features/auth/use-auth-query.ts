import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/features/auth/auth-api";
import { ApiClientError } from "@/lib/api-client";

export const authQueryKey = ["auth", "me"] as const;

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function useAuthQuery() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: async () => {
      try {
        return await fetchCurrentUser();
      } catch (error) {
        if (isUnauthorized(error)) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}
