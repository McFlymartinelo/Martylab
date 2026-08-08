import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutRequest } from "@/features/auth/auth-api";
import { authQueryKey } from "@/features/auth/use-auth-query";

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutRequest(),
    onSettled: async () => {
      queryClient.setQueryData(authQueryKey, null);
      await queryClient.invalidateQueries({ queryKey: authQueryKey });
      await queryClient.invalidateQueries({ queryKey: ["plugins"] });
    },
  });
}
