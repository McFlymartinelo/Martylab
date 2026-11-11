import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  title,
  icon: Icon,
  hint,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground",
        className,
      )}
    >
      {title || hint || action ? (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="flex min-w-0 items-center gap-2 font-heading text-sm font-semibold">
            {Icon ? (
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            ) : null}
            <span className="truncate">{title}</span>
          </h2>
          <div className="flex items-center gap-2">
            {hint ? (
              <span className="font-mono text-2xs text-muted-foreground">
                {hint}
              </span>
            ) : null}
            {action}
          </div>
        </header>
      ) : null}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
