import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { cn } from "@/lib/utils";

interface RadialGaugeProps {
  /** Percentage between 0 and 100. Leave undefined when no data source is connected yet. */
  value?: number;
  size?: number;
  className?: string;
}

export function RadialGauge({ value, size = 88, className }: RadialGaugeProps) {
  const data = [{ value: value ?? 0 }];

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <RadialBarChart
        width={size}
        height={size}
        innerRadius="72%"
        outerRadius="100%"
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          dataKey="value"
          cornerRadius={999}
          background={{ fill: "var(--muted)" }}
          fill={value === undefined ? "var(--muted-foreground)" : "var(--chart-1)"}
          opacity={value === undefined ? 0.3 : 1}
          isAnimationActive={false}
        />
      </RadialBarChart>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold tabular-nums">
          {value !== undefined ? `${value}%` : "N/A"}
        </span>
      </div>
    </div>
  );
}
