export interface OrionStatusResponse {
  configured: boolean;
  online: boolean;
}

export interface OrionClimateResponse {
  available: boolean;
  moduleName: string | null;
  lastSeen: string | null;
  indoor: {
    temperatureCelsius: number | null;
    humidityPercent: number | null;
  };
  outdoor: {
    temperatureCelsius: number | null;
    humidityPercent: number | null;
  };
  co2Ppm: number | null;
}

export type OrionClimateMetric =
  | "indoorTemp"
  | "outdoorTemp"
  | "indoorHumidity"
  | "co2";

export type OrionClimateRange = "24h" | "7d";

export interface OrionClimateHistoryPoint {
  at: string;
  value: number;
}

export interface OrionClimateHistoryResponse {
  available: boolean;
  metric: OrionClimateMetric;
  range: OrionClimateRange;
  unit: string | null;
  points: OrionClimateHistoryPoint[];
}

export type OrionNotificationSeverity = "info" | "warning" | "critical";

export interface OrionNotification {
  id: string;
  type: "climate" | "system";
  severity: OrionNotificationSeverity;
  title: string;
  message: string;
  at: string;
}

export interface OrionNotificationsResponse {
  available: boolean;
  items: OrionNotification[];
}

export interface OrionLight {
  id: string;
  name: string;
  on: boolean;
  brightness: number | null;
  reachable: boolean;
}

export interface OrionLightsResponse {
  available: boolean;
  lights: OrionLight[];
}

export interface OrionSetLightRequest {
  on?: boolean;
  brightness?: number;
}

export interface OrionSetLightResponse {
  ok: boolean;
  lightId: string;
}
