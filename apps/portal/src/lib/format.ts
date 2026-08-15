export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go", "To"];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${Math.round(value * 10) / 10} ${units[unitIndex]}`;
}

export function formatBytesPerSecond(bytes: number): string {
  return `${formatBytes(bytes)}/s`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} j ${hours} h`;
  }
  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }
  return `${minutes} min`;
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function formatTemperature(celsius: number | null): string {
  if (celsius === null) {
    return "—";
  }
  return `${celsius.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} °C`;
}

export function formatHumidity(humidity: number | null): string {
  if (humidity === null) {
    return "—";
  }
  return `${humidity.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %`;
}

export function formatHumidityCompact(humidity: number | null): string {
  if (humidity === null) {
    return "—";
  }
  return `${humidity.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}%`;
}

/** Apparent outdoor temperature from dry-bulb temp and relative humidity (humidex). */
export function computeFeelsLikeCelsius(
  temperatureCelsius: number,
  humidityPercent: number,
): number {
  const vaporPressure =
    6.112 *
    10 ** ((7.5 * temperatureCelsius) / (237.7 + temperatureCelsius)) *
    (humidityPercent / 100);
  const feelsLike = temperatureCelsius + (5 / 9) * (vaporPressure - 10);
  return Math.round(feelsLike * 10) / 10;
}
