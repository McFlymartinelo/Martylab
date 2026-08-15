import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";
import { usageGaugeColor } from "@/lib/system-health";

interface GaugeDialProps {
  value: number;
  max?: number;
  label: string;
  caption?: string;
  color?: string;
  size?: number;
  className?: string;
}

const ARC_DEGREES = 270;
const STROKE_WIDTH = 9;
const ANIMATION_MS = 700;

export function GaugeDial({
  value,
  max = 100,
  label,
  caption,
  color,
  size = 120,
  className,
}: GaugeDialProps) {
  const gradientId = useId();
  const [animatedRatio, setAnimatedRatio] = useState(0);

  const clamped = Math.max(0, Math.min(max, value));
  const ratio = max > 0 ? clamped / max : 0;
  const strokeColor = color ?? usageGaugeColor(clamped);

  const radius = (size - STROKE_WIDTH) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (ARC_DEGREES / 360) * circumference;
  const progressLength = arcLength * animatedRatio;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedRatio(ratio));
    return () => cancelAnimationFrame(frame);
  }, [ratio]);

  return (
    <div
      className={cn("flex flex-col items-center gap-2", className)}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div
        className="relative aspect-square w-full max-w-[5.5rem] sm:max-w-[7.5rem]"
        style={{ maxHeight: size }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="size-full"
          aria-hidden="true"
        >
          <defs>
            <filter id={gradientId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor={strokeColor}
                floodOpacity="0.45"
              />
            </filter>
          </defs>

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(135 ${center} ${center})`}
          />

          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${circumference}`}
            transform={`rotate(135 ${center} ${center})`}
            filter={`url(#${gradientId})`}
            style={{
              transition: `stroke-dasharray ${ANIMATION_MS}ms ease-out`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span className="text-xl font-semibold tabular-nums sm:text-2xl">
            {formatPercent(clamped)}
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {caption ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground/80">{caption}</p>
        ) : null}
      </div>
    </div>
  );
}
