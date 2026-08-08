export type UserRole = "admin" | "user" | "guest";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type DatabaseHealth = "up" | "down" | "not_configured";

export interface HealthResponse {
  status: "ok" | "degraded";
  service: "martylab-backend";
  timestamp: string;
  database: DatabaseHealth;
}

export type PluginCapability =
  | "dashboard"
  | "actions"
  | "notifications"
  | "health";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  capabilities: PluginCapability[];
  enabled: boolean;
}

export interface PluginsResponse {
  plugins: PluginManifest[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: SessionUser;
}

