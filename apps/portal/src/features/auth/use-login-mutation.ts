import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoginRequest } from "@martylab/shared";
import { loginRequest } from "@/features/auth/auth-api";
import { authQueryKey } from "@/features/auth/use-auth-query";

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginRequest(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKey, data);
    },
  });
}
