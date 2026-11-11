import type { SystemMetricsResponse } from "@martylab/shared";
import { Badge } from "@/components/ui/badge";
import { MetricLine } from "@/components/cockpit/metric-line";
import { Sparkline } from "@/components/dashboard/sparkline";
import {
  formatBytes,
  formatBytesPerSecond,
  formatPercent,
  formatTemperature,
  formatUptime,
} from "@/lib/format";
import { computeServerHealthScore } from "@/lib/system-health";
import { cn } from "@/lib/utils";

interface HealthHeroProps {
  metrics: SystemMetricsResponse;
  containers?: { running: number; total: number } | undefined;
  className?: string;
}

function scoreTone(score: number): {
  variant: "success" | "warn" | "destructive";
  label: string;
} {
  if (score >= 85) return { variant: "success", label: "Opérationnel" };
  if (score >= 65) return { variant: "warn", label: "À surveiller" };
  return { variant: "destructive", label: "Dégradé" };
}

export function HealthHero({ metrics, containers, className }: HealthHeroProps) {
  const score = computeServerHealthScore(metrics);
  const tone = scoreTone(score);
  const network = metrics.network;

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 text-card-foreground",
        className,
      )}
      aria-labelledby="health-hero-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            id="health-hero-title"
            className="text-2xs tracking-[0.14em] text-muted-foreground uppercase"
          >
            Santé du labo
          </p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="font-heading text-4xl font-semibold tabular-nums">
              {score}
            </span>
            <span className="font-mono text-sm text-muted-foreground">/ 100</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Source : {metrics.source === "host" ? "serveur hôte" : "conteneur backend"}
            {containers
              ? ` · ${containers.running}/${containers.total} conteneur(s) en marche`
              : null}
          </p>
        </div>

        <Badge variant={tone.variant}>{tone.label}</Badge>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetricLine
          label="CPU"
          value={formatPercent(metrics.cpu.usagePercent)}
          percent={metrics.cpu.usagePercent}
          caption={`${metrics.cpu.cores} cœurs`}
        />
        <MetricLine
          label="RAM"
          value={formatPercent(metrics.memory.usagePercent)}
          percent={metrics.memory.usagePercent}
          caption={`${formatBytes(metrics.memory.usedBytes)} / ${formatBytes(metrics.memory.totalBytes)}`}
        />
        <MetricLine
          label="Disque"
          value={formatPercent(metrics.storage.usagePercent)}
          percent={metrics.storage.usagePercent}
          caption={`${formatBytes(metrics.storage.usedBytes)} / ${formatBytes(metrics.storage.totalBytes)}`}
        />
      </div>

      {metrics.cpu.history.length > 1 ? (
        <div className="mt-4">
          <p className="mb-1 text-2xs text-muted-foreground">
            Charge CPU ({metrics.cpu.history.length} mesures)
          </p>
          <Sparkline data={metrics.cpu.history} className="h-8 w-full" />
        </div>
      ) : null}

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-border pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <dt className="text-muted-foreground">Uptime</dt>
          <dd className="font-mono tabular-nums">
            {formatUptime(metrics.uptimeSeconds)}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-muted-foreground">Temp.</dt>
          <dd className="font-mono tabular-nums">
            {formatTemperature(metrics.temperatureCelsius)}
          </dd>
        </div>
        {network ? (
          <div className="flex items-center gap-1.5">
            <dt className="text-muted-foreground">Réseau</dt>
            <dd className="font-mono tabular-nums">
              ↓ {formatBytesPerSecond(network.receiveBytesPerSecond)} · ↑{" "}
              {formatBytesPerSecond(network.transmitBytesPerSecond)}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
