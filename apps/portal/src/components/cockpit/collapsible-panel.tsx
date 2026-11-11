import { useState, type ReactNode } from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  /** Identifiant stable utilisé pour mémoriser l'état ouvert/fermé. */
  panelId: string;
  title: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  bodyClassName?: string;
}

function storageKey(panelId: string) {
  return `martylab:panel:${panelId}`;
}

function readOpen(panelId: string, defaultOpen: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(storageKey(panelId));
    if (stored === "open") return true;
    if (stored === "closed") return false;
  } catch {
    // localStorage indisponible (navigation privée stricte) : fallback.
  }
  return defaultOpen;
}

/**
 * Panneau repliable du cockpit. Replié par défaut, l'état est mémorisé par
 * panneau pour que la page reste stable entre deux visites.
 */
export function CollapsiblePanel({
  panelId,
  title,
  icon: Icon,
  hint,
  action,
  children,
  defaultOpen = false,
  className,
  bodyClassName,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(() => readOpen(panelId, defaultOpen));

  function handleValueChange(value: unknown[]) {
    const next = value.includes(panelId);
    setOpen(next);
    try {
      window.localStorage.setItem(storageKey(panelId), next ? "open" : "closed");
    } catch {
      // La préférence n'est pas critique : on garde l'état en mémoire.
    }
  }

  return (
    <AccordionPrimitive.Root
      value={open ? [panelId] : []}
      onValueChange={handleValueChange}
    >
      <AccordionPrimitive.Item
        value={panelId}
        className={cn(
          "rounded-xl border border-border bg-card text-card-foreground",
          className,
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <AccordionPrimitive.Header className="flex min-w-0 flex-1">
            <AccordionPrimitive.Trigger
              className="group/panel-trigger flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={typeof title === "string" ? title : undefined}
            >
              {Icon ? (
                <Icon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
              <span className="min-w-0 truncate font-heading text-sm font-semibold">
                {title}
              </span>
              {hint ? (
                <span className="hidden truncate font-mono text-2xs text-muted-foreground sm:inline">
                  {hint}
                </span>
              ) : null}
              <ChevronDown
                className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-open/panel-trigger:rotate-180"
                aria-hidden="true"
              />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        <AccordionPrimitive.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
          <div className={cn("border-t border-border", bodyClassName ?? "p-4")}>
            {children}
          </div>
        </AccordionPrimitive.Panel>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}
