import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disableMfa,
  enableMfa,
  fetchMfaStatus,
  regenerateBackupCodes,
  startMfaSetup,
  verifyMfaRequest,
} from "@/features/auth/mfa-api";
import { authQueryKey } from "@/features/auth/use-auth-query";

export const mfaQueryKey = ["auth", "mfa"] as const;

export function useMfaStatusQuery() {
  return useQuery({
    queryKey: mfaQueryKey,
    queryFn: fetchMfaStatus,
    staleTime: 30_000,
    retry: false,
  });
}

export function useStartMfaSetupMutation() {
  return useMutation({
    mutationFn: (password: string) => startMfaSetup(password),
  });
}

export function useEnableMfaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => enableMfa(code),
    onSuccess: () => {
      // Le serveur marque la session courante comme vérifiée : on rafraîchit
      // l'utilisateur courant et le statut MFA.
      void queryClient.invalidateQueries({ queryKey: authQueryKey });
      void queryClient.invalidateQueries({ queryKey: mfaQueryKey });
    },
  });
}

export function useDisableMfaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (password: string) => disableMfa(password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKey });
      void queryClient.invalidateQueries({ queryKey: mfaQueryKey });
    },
  });
}

export function useRegenerateBackupCodesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => regenerateBackupCodes(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mfaQueryKey });
    },
  });
}

/** Étape 2 du login : échange le défi + le code contre une session. */
export function useVerifyMfaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyMfaRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKey, data);
    },
  });
}
