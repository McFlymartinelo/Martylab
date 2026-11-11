import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KeyValueItem {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

interface KeyValueListProps {
  items: KeyValueItem[];
  className?: string;
}

export function KeyValueList({ items, className }: KeyValueListProps) {
  return (
    <dl className={cn("divide-y divide-border/60", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-3 py-1.5 text-sm"
        >
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd
            className={cn(
              "min-w-0 text-right",
              item.mono && "font-mono text-xs tabular-nums",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
