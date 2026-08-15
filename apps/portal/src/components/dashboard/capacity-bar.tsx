import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";

export interface CapacityVolume {
  label: string;
  usedBytes: number;
  totalBytes: number;
  usagePercent: number;
}

interface CapacityBarProps {
  volume: CapacityVolume;
  className?: string;
}

const SEGMENT_COUNT = 24;
const ANIMATION_MS = 700;

export function CapacityBar({ volume, className }: CapacityBarProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const filledSegments = Math.round(
    (animatedPercent / 100) * SEGMENT_COUNT,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      setAnimatedPercent(volume.usagePercent),
    );
    return () => cancelAnimationFrame(frame);
  }, [volume.usagePercent]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {volume.label}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatBytes(volume.usedBytes)} / {formatBytes(volume.totalBytes)}
        </p>
      </div>

      <div
        className="flex items-end gap-[3px]"
        role="meter"
        aria-valuenow={volume.usagePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Capacité ${volume.label}`}
      >
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => {
          const isFilled = index < filledSegments;
          return (
            <div
              key={index}
              className={cn(
                "h-6 w-[5px] rounded-full transition-colors sm:h-7 sm:w-1.5",
                isFilled
                  ? "bg-chart-1 shadow-[0_0_6px_color-mix(in_oklch,var(--chart-1)_55%,transparent)]"
                  : "bg-muted/60",
              )}
              style={{
                transitionDuration: `${ANIMATION_MS}ms`,
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
}

interface CapacityBarListProps {
  volumes: CapacityVolume[];
  className?: string;
}

export function CapacityBarList({ volumes, className }: CapacityBarListProps) {
  if (volumes.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-xs font-medium text-muted-foreground">Capacité</p>
      {volumes.map((volume) => (
        <CapacityBar key={volume.label} volume={volume} />
      ))}
    </div>
  );
}
