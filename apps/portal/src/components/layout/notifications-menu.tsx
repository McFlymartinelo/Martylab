import { Bell } from "lucide-react";
import {
  useMatchdayNotificationsQuery,
  useMatchdayStatusQuery,
} from "@/features/matchday/use-matchday-query";
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

type NotificationItem = {
  id: string;
  source: "Orion" | "Matchday";
  severity: string;
  title: string;
  message: string;
};

function severityVariant(
  severity: string,
): "success" | "secondary" | "destructive" | "outline" {
  if (severity === "critical") return "destructive";
  if (severity === "warning") return "secondary";
  return "outline";
}

export function NotificationsMenu() {
  const orionStatusQuery = useOrionStatusQuery();
  const orionNotificationsQuery = useOrionNotificationsQuery(
    orionStatusQuery.data?.configured === true &&
      orionStatusQuery.data.online === true,
  );

  const matchdayStatusQuery = useMatchdayStatusQuery();
  const matchdayNotificationsQuery = useMatchdayNotificationsQuery(
    matchdayStatusQuery.data?.configured === true &&
      matchdayStatusQuery.data.online === true,
  );

  const orionItems: NotificationItem[] = (
    orionNotificationsQuery.data?.items ?? []
  ).map((item) => ({
    id: `orion-${item.id}`,
    source: "Orion",
    severity: item.severity,
    title: item.title,
    message: item.message,
  }));

  const matchdayItems: NotificationItem[] = (
    matchdayNotificationsQuery.data?.items ?? []
  ).map((item) => ({
    id: `matchday-${item.id}`,
    source: "Matchday",
    severity: item.severity,
    title: item.title,
    message: item.message,
  }));

  const items = [...orionItems, ...matchdayItems];
  const alertCount = items.filter(
    (item) => item.severity === "warning" || item.severity === "critical",
  ).length;

  const isLoading =
    orionNotificationsQuery.isLoading || matchdayNotificationsQuery.isLoading;

  const orionConfigured = orionStatusQuery.data?.configured ?? false;
  const matchdayConfigured = matchdayStatusQuery.data?.configured ?? false;
  const orionOnline = orionStatusQuery.data?.online ?? false;
  const matchdayOnline = matchdayStatusQuery.data?.online ?? false;

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
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Chargement…
          </p>
        ) : null}

        {!isLoading && !orionConfigured && !matchdayConfigured ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Aucun connecteur de notifications configuré.
          </p>
        ) : null}

        {!isLoading &&
        (orionConfigured || matchdayConfigured) &&
        items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            {!orionOnline && !matchdayOnline
              ? "Services hors ligne."
              : "Aucune notification pour le moment."}
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
                <p className="mb-1 text-xs text-muted-foreground">
                  {item.source}
                </p>
                <p className="text-xs text-muted-foreground">{item.message}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
