import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  healthStatusDescription,
  healthStatusLabel,
} from "@/lib/system-health";

interface HealthBarProps {
  value: number;
  className?: string;
}

const SEGMENT_COUNT = 20;
const ANIMATION_MS = 700;

function segmentColor(index: number): string {
  const ratio = index / (SEGMENT_COUNT - 1);
  if (ratio < 0.35) return "var(--destructive)";
  if (ratio < 0.65) return "var(--chart-5)";
  if (ratio < 0.85) return "var(--chart-4)";
  return "var(--success)";
}

export function HealthBar({ value, className }: HealthBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedValue(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const cursorBottomPercent = animatedValue;

  return (
    <div
      className={cn("flex items-stretch gap-4", className)}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Santé du serveur"
    >
      <div className="relative flex flex-col-reverse items-center gap-[3px]">
        <span className="text-[10px] tabular-nums text-muted-foreground">0%</span>

        <div className="relative flex h-44 flex-col-reverse gap-[3px] sm:h-52">
          {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
            <div
              key={index}
              className="h-[5px] w-5 rounded-full sm:w-6"
              style={{ backgroundColor: segmentColor(index) }}
              aria-hidden="true"
            />
          ))}

          <div
            className="pointer-events-none absolute left-0 right-0 h-0.5 rounded-full bg-foreground shadow-[0_0_6px_rgba(255,255,255,0.6)]"
            style={{
              bottom: `calc(${cursorBottomPercent}% - 1px)`,
              transition: `bottom ${ANIMATION_MS}ms ease-out`,
            }}
            aria-hidden="true"
          />
        </div>

        <span className="text-[10px] tabular-nums text-muted-foreground">
          100%
        </span>
      </div>

      <div className="flex flex-col justify-center gap-1 py-2">
        <p className="text-3xl font-semibold tabular-nums sm:text-4xl">
          {clamped}%
        </p>
        <p className="text-sm font-medium">{healthStatusLabel(clamped)}</p>
        <p className="max-w-[12rem] text-xs text-muted-foreground">
          {healthStatusDescription(clamped)}
        </p>
      </div>
    </div>
  );
}
