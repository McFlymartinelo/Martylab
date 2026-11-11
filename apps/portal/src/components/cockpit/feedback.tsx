import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function InlineEmpty({
  icon: Icon,
  title,
  description,
  className,
}: InlineEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center",
        className,
      )}
    >
      {Icon ? (
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

interface UnavailableProps {
  label: string;
  reason: string;
  className?: string;
}

/**
 * Bloc « non disponible » honnête : aucun chiffre inventé, la raison est
 * affichée pour que l'écart soit compréhensible en production.
 */
export function Unavailable({ label, reason, className }: UnavailableProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2.5",
        className,
      )}
    >
      <p className="text-xs font-medium">
        {label} : non disponible
      </p>
      <p className="mt-0.5 text-2xs text-muted-foreground">{reason}</p>
    </div>
  );
}
