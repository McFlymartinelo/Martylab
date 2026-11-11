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
  createdAt: string;
  /** Un second facteur (TOTP) est activé sur ce compte. */
  mfaEnabled: boolean;
}

export interface AuthSessionEntry {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
  /** La session a été ouverte avec un second facteur validé. */
  mfaVerified: boolean;
  current: boolean;
}

export interface AuthSessionsResponse {
  sessions: AuthSessionEntry[];
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

/**
 * Réponse de `POST /api/auth/login`.
 *
 * Le mot de passe seul n'ouvre plus de session quand un second facteur est
 * activé : le serveur renvoie un défi signé, court, à présenter avec le code
 * TOTP sur `POST /api/auth/mfa/verify`.
 */
export type LoginResponse =
  | { status: "ok"; user: SessionUser }
  | { status: "mfa_required"; challengeToken: string };

export interface MfaVerifyRequest {
  challengeToken: string;
  code: string;
}

export interface MfaStatusResponse {
  /** Un second facteur est activé sur le compte. */
  enabled: boolean;
  /** La session courante a été ouverte avec ce second facteur. */
  sessionVerified: boolean;
  /** Codes de secours encore utilisables. */
  backupCodesRemaining: number;
}

export interface MfaSetupRequest {
  /** Le mot de passe est exigé : une session volée ne peut pas enrôler un 2FA. */
  password: string;
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUri: string;
  /** QR code PNG en data URL, prêt à afficher dans une balise <img>. */
  qrDataUrl: string;
}

export interface MfaEnableRequest {
  code: string;
}

export interface MfaEnableResponse {
  backupCodes: string[];
}

export interface MfaDisableRequest {
  password: string;
}

export interface MfaBackupCodesResponse {
  backupCodes: string[];
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
  network?: {
    receiveBytesPerSecond: number;
    transmitBytesPerSecond: number;
    receiveHistory: number[];
    transmitHistory: number[];
    interfaces: SystemNetworkInterface[];
  };
  processes?: SystemProcessEntry[];
}

export interface SystemNetworkInterface {
  name: string;
  receiveBytesPerSecond: number;
  transmitBytesPerSecond: number;
  operState?: string | null;
  macAddress?: string | null;
  speedMbps?: number | null;
  mtu?: number | null;
  receivePackets?: number | null;
  transmitPackets?: number | null;
  receiveErrors?: number | null;
  transmitErrors?: number | null;
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
  uid?: number | null;
  cpuTimeTicks?: number | null;
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
  ConsoleAuditEntry,
  ConsoleAuditResponse,
  ConsoleAuditStatus,
  ConsoleCommandDefinition,
  ConsoleCommandsResponse,
  ConsoleExecuteRequest,
  ConsoleExecuteResponse,
  ConsoleRisk,
  ConsoleTerminalClientMessage,
  ConsoleTerminalServerMessage,
  ConsoleTerminalSessionRequest,
} from "./console.js";

export type {
  SystemDiskIoEntry,
  SystemFanEntry,
  SystemHardwareResponse,
  SystemHostFacts,
  SystemLoadAverage,
  SystemMountEntry,
  SystemOverviewResponse,
  SystemRaidEntry,
  SystemSensorEntry,
  SystemStorageResponse,
  SystemSwapUsage,
} from "./system.js";

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
