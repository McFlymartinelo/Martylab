import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAuthSessions,
  revokeAuthSession,
  revokeOtherAuthSessions,
} from "@/features/auth/sessions-api";

export const authSessionsQueryKey = ["auth", "sessions"] as const;

export function useAuthSessionsQuery(enabled = true) {
  return useQuery({
    queryKey: authSessionsQueryKey,
    queryFn: fetchAuthSessions,
    enabled,
    staleTime: 30_000,
  });
}

export function useRevokeAuthSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeAuthSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authSessionsQueryKey });
    },
  });
}

export function useRevokeOtherAuthSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeOtherAuthSessions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authSessionsQueryKey });
    },
  });
}
