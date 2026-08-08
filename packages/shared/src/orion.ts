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
