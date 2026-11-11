import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoginRequest } from "@martylab/shared";
import { loginRequest } from "@/features/auth/auth-api";
import { authQueryKey } from "@/features/auth/use-auth-query";

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginRequest(payload),
    onSuccess: (data) => {
      // Avec un second facteur, le serveur ne renvoie qu'un défi : aucune
      // session n'existe encore et il ne faut pas mettre l'utilisateur en cache.
      if (data.status === "ok") {
        queryClient.setQueryData(authQueryKey, { user: data.user });
      }
    },
  });
}
