import type { SystemMetricsResponse } from "@martylab/shared";
import { Clock, Thermometer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CapacityBarList } from "@/components/dashboard/capacity-bar";
import { GaugeDial } from "@/components/dashboard/gauge-dial";
import { HealthBar } from "@/components/dashboard/health-bar";
import { formatBytes, formatTemperature, formatUptime } from "@/lib/format";
import { computeServerHealthScore } from "@/lib/system-health";

interface SystemInstrumentationPanelProps {
  metrics: SystemMetricsResponse;
}

function formatStorageLabel(path: string): string {
  if (path === "/") return "Racine (/)";
  return path;
}

export function SystemInstrumentationPanel({
  metrics,
}: SystemInstrumentationPanelProps) {
  const healthScore = computeServerHealthScore(metrics);

  const storageVolumes = [
    {
      label: formatStorageLabel(metrics.storage.path),
      usedBytes: metrics.storage.usedBytes,
      totalBytes: metrics.storage.totalBytes,
      usagePercent: metrics.storage.usagePercent,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Ressources serveur</CardTitle>
        <CardDescription>
          Source :{" "}
          {metrics.source === "host" ? "serveur hôte" : "conteneur backend"} ·
          mesure disque sur <code>{metrics.storage.path}</code>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
          <HealthBar value={healthScore} className="justify-center lg:justify-start" />

          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            <GaugeDial
              label="CPU"
              value={metrics.cpu.usagePercent}
              caption={`${metrics.cpu.cores} cœurs`}
            />
            <GaugeDial
              label="RAM"
              value={metrics.memory.usagePercent}
              caption={`${formatBytes(metrics.memory.usedBytes)} / ${formatBytes(metrics.memory.totalBytes)}`}
            />
            <GaugeDial
              label="Stockage"
              value={metrics.storage.usagePercent}
              caption={`${formatBytes(metrics.storage.usedBytes)} / ${formatBytes(metrics.storage.totalBytes)}`}
            />
          </div>
        </div>

        <div className="grid gap-6 border-t border-border pt-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <CapacityBarList volumes={storageVolumes} />

          <div className="flex flex-wrap gap-4 lg:flex-col lg:gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-[11px] text-muted-foreground">Uptime</p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatUptime(metrics.uptimeSeconds)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <Thermometer
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div>
                <p className="text-[11px] text-muted-foreground">Température</p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatTemperature(metrics.temperatureCelsius)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
