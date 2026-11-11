import { cn } from "@/lib/utils";

type MetricTone = "accent" | "warn" | "danger" | "muted";

const toneBar: Record<MetricTone, string> = {
  accent: "bg-primary",
  warn: "bg-warn",
  danger: "bg-destructive",
  muted: "bg-muted-foreground/60",
};

function toneForPercent(percent: number): MetricTone {
  if (percent >= 90) return "danger";
  if (percent >= 75) return "warn";
  return "accent";
}

interface MetricLineProps {
  label: string;
  value: string;
  percent: number;
  caption?: string;
  tone?: MetricTone;
  className?: string;
}

export function MetricLine({
  label,
  value,
  percent,
  caption,
  tone,
  className,
}: MetricLineProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const resolvedTone = tone ?? toneForPercent(clamped);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xs tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {value}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full", toneBar[resolvedTone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {caption ? (
        <p className="truncate text-2xs text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}
