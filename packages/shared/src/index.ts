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

export interface SystemNetworkInterface {
  name: string;
  receiveBytesPerSecond: number;
  transmitBytesPerSecond: number;
}

export interface SystemNetworkResponse {
  source: "host" | "container";
  timestamp: string;
  receiveBytesPerSecond: number;
  transmitBytesPerSecond: number;
  receiveHistory: number[];
  transmitHistory: number[];
  interfaces: SystemNetworkInterface[];
}

export interface SystemProcessEntry {
  pid: number;
  name: string;
  memoryBytes: number;
  memoryPercent: number;
  state: string;
}

export interface SystemProcessesResponse {
  source: "host" | "container";
  timestamp: string;
  processes: SystemProcessEntry[];
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
  AssistantActionLogEntry,
  AssistantActionLogsResponse,
  AssistantActionStatus,
  AssistantConfirmationResponse,
  AssistantConversation,
  AssistantConversationDetail,
  AssistantConversationsResponse,
  AssistantMessage,
  AssistantMessageMetadata,
  AssistantMessageRole,
  AssistantSendMessageRequest,
  AssistantSendMessageResponse,
  AssistantToolDefinition,
  AssistantToolRisk,
  AssistantToolsResponse,
} from "./assistant.js";
export type {
  PushPublicKeyResponse,
  PushStatusResponse,
  PushSubscribeRequest,
  PushSubscribeResponse,
} from "./push.js";
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
  ImmichAlbumSummary,
  ImmichAssetStats,
  ImmichInstanceId,
  ImmichInstanceStatus,
  ImmichInstanceSummary,
  ImmichPageResponse,
  ImmichStatusResponse,
  ImmichSummaryResponse,
} from "./immich.js";
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
