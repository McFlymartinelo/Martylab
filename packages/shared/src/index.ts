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

export interface UsersResponse {
  users: User[];
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  displayName?: string;
  password?: string;
  role?: UserRole;
}

export interface SystemMetricsResponse {
  source: "host" | "container";
  timestamp: string;
  cpu: {
    usagePercent: number;
    cores: number;
    history: number[];
  };
  memory: {
    usedBytes: number;
    totalBytes: number;
    usagePercent: number;
  };
  storage: {
    usedBytes: number;
    totalBytes: number;
    usagePercent: number;
    path: string;
  };
  uptimeSeconds: number;
  temperatureCelsius: number | null;
}

export interface DockerContainerSummary {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

export interface DockerContainersResponse {
  available: boolean;
  containers: DockerContainerSummary[];
}

export interface DockerContainerLogsResponse {
  logs: string;
}

export type DockerContainerAction = "start" | "stop" | "restart";

export type {
  JellyfinLibrary,
  JellyfinMediaItem,
  JellyfinPageResponse,
  JellyfinPlaybackSession,
  JellyfinServerInfo,
  JellyfinStatusResponse,
  JellyfinSummaryResponse,
} from "./jellyfin.js";
export type {
  MatchdayChatMessage,
  MatchdayMatch,
  MatchdayNotification,
  MatchdayNotificationsResponse,
  MatchdayNotificationSeverity,
  MatchdayPageResponse,
  MatchdayStandingEntry,
  MatchdayStatusResponse,
  MatchdaySummaryResponse,
  MatchdayUpcomingMatch,
} from "./matchday.js";
export type {
  CloudflareHostnameCheck,
  CloudflareStatusResponse,
} from "./cloudflare.js";
export type {
  NasDiskSummary,
  NasStatusResponse,
  NasStoragePool,
} from "./nas.js";
export type {
  PortainerContainerSummary,
  PortainerImageSummary,
  PortainerOverviewResponse,
  PortainerStatusResponse,
  PortainerVolumeSummary,
} from "./portainer.js";
export type {
  OrionClimateHistoryPoint,
  OrionClimateHistoryResponse,
  OrionClimateMetric,
  OrionClimateRange,
  OrionClimateResponse,
  OrionLight,
  OrionLightsResponse,
  OrionNotification,
  OrionNotificationsResponse,
  OrionNotificationSeverity,
  OrionSetLightRequest,
  OrionSetLightResponse,
  OrionStatusResponse,
} from "./orion.js";
