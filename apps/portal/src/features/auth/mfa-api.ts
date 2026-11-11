import type {
  AuthResponse,
  MfaBackupCodesResponse,
  MfaEnableResponse,
  MfaSetupResponse,
  MfaStatusResponse,
  MfaVerifyRequest,
} from "@martylab/shared";
import { apiGet, apiPost } from "@/lib/api-client";

export function fetchMfaStatus(): Promise<MfaStatusResponse> {
  return apiGet<MfaStatusResponse>("/api/auth/mfa");
}

export function verifyMfaRequest(
  payload: MfaVerifyRequest,
): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/mfa/verify", payload);
}

export function startMfaSetup(password: string): Promise<MfaSetupResponse> {
  return apiPost<MfaSetupResponse>("/api/auth/mfa/setup", { password });
}

export function enableMfa(code: string): Promise<MfaEnableResponse> {
  return apiPost<MfaEnableResponse>("/api/auth/mfa/enable", { code });
}

export function disableMfa(password: string): Promise<void> {
  return apiPost<void>("/api/auth/mfa/disable", { password });
}

export function regenerateBackupCodes(
  code: string,
): Promise<MfaBackupCodesResponse> {
  return apiPost<MfaBackupCodesResponse>("/api/auth/mfa/backup-codes", { code });
}
