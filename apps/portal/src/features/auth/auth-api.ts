import type { AuthResponse, LoginRequest } from "@martylab/shared";
import { apiGet, apiPost } from "@/lib/api-client";

export function fetchCurrentUser(): Promise<AuthResponse> {
  return apiGet<AuthResponse>("/api/auth/me");
}

export function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/auth/login", payload);
}

export function logoutRequest(): Promise<void> {
  return apiPost<void>("/api/auth/logout");
}
