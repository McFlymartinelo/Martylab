import type { AuthSessionsResponse } from "@martylab/shared";
import { apiDelete, apiGet, apiPostVoid } from "@/lib/api-client";

export function fetchAuthSessions(): Promise<AuthSessionsResponse> {
  return apiGet<AuthSessionsResponse>("/api/auth/sessions");
}

export function revokeAuthSession(sessionId: string): Promise<void> {
  return apiDelete(`/api/auth/sessions/${sessionId}`);
}

export function revokeOtherAuthSessions(): Promise<void> {
  return apiPostVoid("/api/auth/sessions/revoke-others");
}
