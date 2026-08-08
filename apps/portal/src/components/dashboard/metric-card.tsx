import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  icon: LucideIcon;
  /** Main figure, e.g. "23 %". Omit when the metric is not available yet. */
  value?: string;
  caption?: string;
  tone?: "default" | "success" | "warning";
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-destructive/10 text-destructive",
};

export function MetricCard({
  label,
  icon: Icon,
  value,
  caption,
  tone = "default",
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              toneClasses[tone],
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
        </div>
        <p className="text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
