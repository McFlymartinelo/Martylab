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

export interface HealthResponse {
  status: "ok";
  service: "martylab-backend";
  timestamp: string;
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
