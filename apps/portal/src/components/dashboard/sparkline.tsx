import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  /** History points, most recent last. Leave undefined when no data source is connected yet. */
  data?: number[];
  className?: string;
}

export function Sparkline({ data, className }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={`flex h-12 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground ${className ?? ""}`}
      >
        Historique indisponible
      </div>
    );
  }

  const points = data.map((value, index) => ({ index, value }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={48}>
        <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#sparkline-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
