import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { useSystemLiveQuery } from "@/features/system/use-system-metrics-query";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  source: "Orion" | "Matchday" | "Serveur" | "Conteneur Martylab";
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
  const authQuery = useAuthQuery();
  const userId = authQuery.data?.user.id ?? "unknown";
  const [readIds, setReadIds] = useState<string[]>([]);
  const [readStateLoadedFor, setReadStateLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`martylab.notifications.read.v1.${userId}`);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      setReadIds(
        Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === "string")
          : [],
      );
    } catch {
      setReadIds([]);
    }
    setReadStateLoadedFor(userId);
  }, [userId]);

  useEffect(() => {
    if (readStateLoadedFor !== userId) return;
    try {
      localStorage.setItem(
        `martylab.notifications.read.v1.${userId}`,
        JSON.stringify(readIds.slice(-500)),
      );
    } catch {
      // Notification read state remains usable for the current visit.
    }
  }, [readIds, readStateLoadedFor, userId]);

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
  // Les métriques hôte ne changent pas au rythme du tableau de bord. Une
  // lecture par minute suffit pour les alertes et évite de solliciter l'API.
  const systemMetricsQuery = useSystemLiveQuery(
    60_000,
    authQuery.data?.user != null,
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

  const metrics = systemMetricsQuery.data;
  const metricAlert = (
    id: string,
    label: string,
    value: number,
    warningAt: number,
    criticalAt: number,
  ): NotificationItem | null => {
    if (value < warningAt) return null;
    const severity = value >= criticalAt ? "critical" : "warning";
    return {
      id: `system-${id}`,
      source: metrics?.source === "host" ? "Serveur" : "Conteneur Martylab",
      severity,
      title: `Seuil ${label} dépassé`,
      message: `${value.toFixed(1)} % · alerte à ${warningAt} % · critique à ${criticalAt} %.`,
    };
  };

  const systemItems: NotificationItem[] = metrics
    ? [
        metricAlert("cpu", "CPU", metrics.cpu.usagePercent, 80, 90),
        metricAlert("memory", "Mémoire", metrics.memory.usagePercent, 85, 95),
        metricAlert("storage", "Stockage", metrics.storage.usagePercent, 85, 95),
      ].filter((item): item is NotificationItem => item !== null)
    : [];

  const items = [...systemItems, ...orionItems, ...matchdayItems];
  const unreadCount = items.filter((item) => !readIds.includes(item.id)).length;

  const isLoading =
    orionNotificationsQuery.isLoading ||
    matchdayNotificationsQuery.isLoading ||
    (authQuery.data?.user != null && systemMetricsQuery.isLoading);

  const orionConfigured = orionStatusQuery.data?.configured ?? false;
  const matchdayConfigured = matchdayStatusQuery.data?.configured ?? false;
  const orionOnline = orionStatusQuery.data?.online ?? false;
  const matchdayOnline = matchdayStatusQuery.data?.online ?? false;
  const externalConnectorConfigured = orionConfigured || matchdayConfigured;
  const hasNotificationSource = externalConnectorConfigured || metrics != null;

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
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 bg-popover p-2">
        <div className="flex items-center justify-between px-1.5 py-1 text-xs font-medium text-muted-foreground">
          Notifications <span className="text-2xs text-muted-foreground">{unreadCount} non lue(s)</span>
        </div>
        <DropdownMenuSeparator />

        {unreadCount > 0 ? (
          <DropdownMenuItem
            onClick={() => setReadIds((current) => [...new Set([...current, ...items.map((item) => item.id)])])}
          >
            <CheckCheck aria-hidden="true" />
            Tout marquer comme lu
          </DropdownMenuItem>
        ) : null}

        {isLoading ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Chargement des notifications…
          </p>
        ) : null}

        {!isLoading && !hasNotificationSource ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            {systemMetricsQuery.isError
              ? "Métriques serveur indisponibles dans cet environnement. Aucun connecteur externe configuré."
              : "Aucun connecteur de notifications configuré."}
          </p>
        ) : null}

        {!isLoading &&
        hasNotificationSource &&
        items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            {!metrics && externalConnectorConfigured && !orionOnline && !matchdayOnline
              ? "Services hors ligne."
              : "Aucune alerte pour le moment."}
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className={`items-stretch rounded-lg border px-3 py-2 text-sm whitespace-normal ${readIds.includes(item.id) ? "border-border bg-background opacity-75" : "border-primary/30 bg-primary/5"}`}
                onClick={() => setReadIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
              >
                <div className="flex min-w-0 flex-col items-stretch gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 font-medium">{item.title}</p>
                    <Badge variant={severityVariant(item.severity)}>
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.source}</p>
                  <p className="text-xs text-muted-foreground">{item.message}</p>
                  <span className="sr-only">
                    {readIds.includes(item.id) ? "Marquer comme non lue" : "Marquer comme lue"}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
