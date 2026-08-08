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
