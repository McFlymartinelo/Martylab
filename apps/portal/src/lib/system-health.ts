import type { SystemMetricsResponse } from "@martylab/shared";

export function computeServerHealthScore(
  metrics: SystemMetricsResponse,
): number {
  const loadAvg =
    (metrics.cpu.usagePercent +
      metrics.memory.usagePercent +
      metrics.storage.usagePercent) /
    3;

  const uptimeDays = metrics.uptimeSeconds / 86_400;
  const uptimeScore = Math.min(100, (uptimeDays / 7) * 100);

  const loadScore = Math.max(0, 100 - loadAvg);
  const health = loadScore * 0.65 + uptimeScore * 0.35;

  return Math.round(Math.max(0, Math.min(100, health)));
}

export function healthStatusLabel(value: number): string {
  if (value >= 85) return "Excellent";
  if (value >= 70) return "Bon";
  if (value >= 50) return "Moyen";
  return "Faible";
}

export function healthStatusDescription(value: number): string {
  if (value >= 85) return "Charge faible et disponibilité stable.";
  if (value >= 70) return "Ressources dans une plage normale.";
  if (value >= 50) return "Surveillez la charge et le stockage.";
  return "Charge élevée ou disponibilité limitée.";
}

export function usageGaugeColor(percent: number): string {
  if (percent >= 90) return "var(--destructive)";
  if (percent >= 75) return "var(--chart-4)";
  return "var(--chart-1)";
}
