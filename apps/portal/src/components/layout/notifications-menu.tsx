import { Bell } from "lucide-react";
import {
  useOrionNotificationsQuery,
  useOrionStatusQuery,
} from "@/features/orion/use-orion-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function severityVariant(
  severity: string,
): "success" | "secondary" | "destructive" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "secondary";
  return "outline";
}

export function NotificationsMenu() {
  const statusQuery = useOrionStatusQuery();
  const notificationsQuery = useOrionNotificationsQuery(
    statusQuery.data?.configured === true && statusQuery.data.online === true,
  );

  const items = notificationsQuery.data?.items ?? [];
  const alertCount = items.filter(
    (item) => item.severity === "warning" || item.severity === "critical",
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Notifications"
            className="relative"
          >
            <Bell className="size-4" aria-hidden="true" />
            {alertCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {alertCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 bg-popover p-2">
        <DropdownMenuLabel>Notifications Orion</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notificationsQuery.isLoading ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Chargement…
          </p>
        ) : null}

        {!statusQuery.data?.configured ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Connecteur Orion non configuré.
          </p>
        ) : null}

        {statusQuery.data?.configured && !statusQuery.data.online ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Orion hors ligne.
          </p>
        ) : null}

        {statusQuery.data?.online && items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Aucune notification pour le moment.
          </p>
        ) : null}

        {items.length > 0 ? (
          <ul className="max-h-72 space-y-2 overflow-y-auto px-1 py-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={severityVariant(item.severity)}>
                    {item.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.message}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
