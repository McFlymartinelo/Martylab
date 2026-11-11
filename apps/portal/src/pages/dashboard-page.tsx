import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Blocks,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import {
  dockerContainersQueryKey,
  useDockerContainersQuery,
} from "@/features/docker/use-docker-query";
import {
  pluginsQueryKey,
  usePluginsQuery,
} from "@/features/plugins/use-plugins-query";
import {
  systemLiveQueryKey,
  useSystemLiveQuery,
} from "@/features/system/use-system-metrics-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InlineEmpty } from "@/components/cockpit/feedback";
import { PageHeader } from "@/components/cockpit/page-header";
import { AppIcon } from "@/components/dashboard/app-icon";
import { HealthHero } from "@/components/dashboard/health-hero";
import { HomeLightsPanel } from "@/components/dashboard/home-lights-panel";
import { HomePanel } from "@/components/dashboard/home-panel";
import { ImmichPanel } from "@/components/dashboard/immich-panel";
import { JellyfinPanel } from "@/components/dashboard/jellyfin-panel";
import { MatchdayPanel } from "@/components/dashboard/matchday-panel";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";
import { TodayPanel } from "@/components/dashboard/today-panel";

function firstName(displayName: string | undefined): string {
  return displayName?.split(" ")[0] ?? "à toi";
}

function todayEyebrow(): string {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  return formatted;
}

const dashboardWidgets = [
  { id: "overview", label: "Vue système et aujourd'hui" },
  { id: "assistant", label: "Assistant" },
  { id: "univers", label: "Maison, Matchday, Photos et Jellyfin" },
  { id: "activity", label: "Activité récente" },
  { id: "apps", label: "Applications" },
] as const;

type DashboardWidgetId = (typeof dashboardWidgets)[number]["id"];
type DashboardPreferences = {
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
};

const defaultDashboardPreferences: DashboardPreferences = {
  order: dashboardWidgets.map((widget) => widget.id),
  hidden: [],
};

function readDashboardPreferences(userId: string): DashboardPreferences {
  try {
    const raw = localStorage.getItem(`martylab.dashboard.v1.${userId}`);
    if (!raw) return defaultDashboardPreferences;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultDashboardPreferences;
    const value = parsed as Partial<DashboardPreferences>;
    const validIds = new Set(dashboardWidgets.map((widget) => widget.id));
    const order = Array.isArray(value.order)
      ? value.order.filter(
          (id): id is DashboardWidgetId =>
            typeof id === "string" && validIds.has(id as DashboardWidgetId),
        )
      : [];
    const hidden = Array.isArray(value.hidden)
      ? value.hidden.filter(
          (id): id is DashboardWidgetId =>
            typeof id === "string" && validIds.has(id as DashboardWidgetId),
        )
      : [];
    return {
      order: [
        ...order,
        ...dashboardWidgets
          .map((widget) => widget.id)
          .filter((id) => !order.includes(id)),
      ],
      hidden: [...new Set(hidden)],
    };
  } catch {
    return defaultDashboardPreferences;
  }
}

function SectionHeading({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {title}
      </h2>
      {action}
    </div>
  );
}

export function DashboardPage() {
  const authQuery = useAuthQuery();
  // 5 s sur le tableau de bord : réactif sans vider la batterie mobile.
  const metricsQuery = useSystemLiveQuery(5_000);
  const dockerQuery = useDockerContainersQuery();
  const pluginsQuery = usePluginsQuery();
  const queryClient = useQueryClient();

  const user = authQuery.data?.user;
  const metrics = metricsQuery.data;
  const userId = user?.id ?? "unknown";
  const [preferences, setPreferences] = useState(defaultDashboardPreferences);
  const [preferencesLoadedFor, setPreferencesLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    setPreferences(readDashboardPreferences(userId));
    setPreferencesLoadedFor(userId);
  }, [userId]);

  useEffect(() => {
    if (preferencesLoadedFor !== userId) return;
    try {
      localStorage.setItem(
        `martylab.dashboard.v1.${userId}`,
        JSON.stringify(preferences),
      );
    } catch {
      // Preferences remain usable for this visit when storage is unavailable.
    }
  }, [preferences, preferencesLoadedFor, userId]);

  const containers = dockerQuery.data?.available
    ? {
        running: dockerQuery.data.containers.filter(
          (container) => container.state === "running",
        ).length,
        total: dockerQuery.data.containers.length,
      }
    : undefined;

  const apps = pluginsQuery.data?.plugins.slice(0, 6) ?? [];

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: systemLiveQueryKey });
    void queryClient.invalidateQueries({ queryKey: dockerContainersQueryKey });
    void queryClient.invalidateQueries({ queryKey: pluginsQueryKey });
  }

  function moveWidget(id: DashboardWidgetId, offset: -1 | 1) {
    setPreferences((current) => {
      const index = current.order.indexOf(id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.order.length) return current;
      const order = [...current.order];
      [order[index], order[target]] = [order[target]!, order[index]!];
      return { ...current, order };
    });
  }

  function renderWidget(id: DashboardWidgetId) {
    if (preferences.hidden.includes(id)) return null;
    switch (id) {
      case "overview":
        return (
          <div key={id} className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              {metrics ? (
                <HealthHero metrics={metrics} containers={containers} />
              ) : metricsQuery.isError ? (
                <InlineEmpty
                  icon={RefreshCw}
                  title="Métriques système indisponibles"
                  description="Le backend n'a pas pu lire les métriques. Sur Windows, la lecture de /proc n'est disponible qu'en production Debian ou dans le conteneur Docker."
                  className="h-full justify-center"
                />
              ) : (
                <div className="h-full min-h-52 animate-pulse rounded-xl border border-border bg-card" aria-hidden="true" />
              )}
            </div>
            <TodayPanel />
          </div>
        );
      case "assistant":
        return (
          <Card key={id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">Assistant Martylab</p>
                  <p className="text-xs text-muted-foreground">
                    Outils explicites, permissions par rôle et confirmation des actions sensibles.
                  </p>
                </div>
              </div>
              <Button variant="secondary" render={<Link to="/assistant" />}>
                Ouvrir l&apos;assistant <ArrowRight aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        );
      case "univers":
        return (
          <section key={id} className="space-y-4">
            <SectionHeading icon={Blocks} title="Univers" />
            <HomePanel />
            <HomeLightsPanel />
            <MatchdayPanel />
            <ImmichPanel />
            <JellyfinPanel />
          </section>
        );
      case "activity":
        return <section key={id}><RecentActivityPanel /></section>;
      case "apps":
        return (
          <section key={id} className="space-y-4">
            <SectionHeading
              icon={Blocks}
              title="Applications"
              action={<Button variant="ghost" size="sm" render={<Link to="/apps" />}>Registre →</Button>}
            />
            {pluginsQuery.isLoading ? <p className="text-sm text-muted-foreground">Chargement des applications…</p> : null}
            {pluginsQuery.isError ? (
              <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Le registre de plugins (<code>/api/plugins</code>) est indisponible pour le moment.</CardContent></Card>
            ) : null}
            {pluginsQuery.data && apps.length === 0 ? (
              <InlineEmpty icon={Blocks} title="Aucune application enregistrée" description="Le registre de plugins est vide pour le moment." />
            ) : null}
            {apps.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {apps.map((plugin) => (
                  <Card key={plugin.id}>
                    <CardContent className="flex items-center gap-3">
                      <AppIcon name={plugin.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{plugin.name}</p>
                        <p className="truncate text-xs text-muted-foreground">v{plugin.version}</p>
                      </div>
                      <Badge variant={plugin.enabled ? "success" : "outline"}>{plugin.enabled ? "Actif" : "Inactif"}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </section>
        );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={todayEyebrow()}
        title={`Bonjour ${firstName(user?.displayName)}.`}
        description="L'état réel de ton laboratoire, sans données simulées."
        actions={
          <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="flex h-8 cursor-pointer list-none items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              Personnaliser
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
              <p className="mb-2 text-xs text-muted-foreground">Widgets affichés et ordre du tableau de bord. Ces préférences sont enregistrées sur cet appareil et ce compte.</p>
              <ul className="space-y-1">
                {preferences.order.map((id, index) => {
                  const widget = dashboardWidgets.find((item) => item.id === id)!;
                  const visible = !preferences.hidden.includes(id);
                  return (
                    <li key={id} className="flex items-center gap-1 rounded-lg px-1 py-1 text-sm hover:bg-muted/40">
                      <button
                        type="button"
                        aria-pressed={visible}
                        onClick={() => setPreferences((current) => ({
                          ...current,
                          hidden: visible
                            ? [...current.hidden, id]
                            : current.hidden.filter((hiddenId) => hiddenId !== id),
                        }))}
                        className="min-w-0 flex-1 truncate text-left"
                      >
                        <span aria-hidden="true" className="mr-2">{visible ? "☑" : "□"}</span>{widget.label}
                      </button>
                      <Button variant="ghost" size="icon-xs" aria-label={`Monter ${widget.label}`} disabled={index === 0} onClick={() => moveWidget(id, -1)}><ArrowUp aria-hidden="true" /></Button>
                      <Button variant="ghost" size="icon-xs" aria-label={`Descendre ${widget.label}`} disabled={index === preferences.order.length - 1} onClick={() => moveWidget(id, 1)}><ArrowDown aria-hidden="true" /></Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={metricsQuery.isFetching}
          >
            <RefreshCw
              className={metricsQuery.isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
            Actualiser
          </Button>
          </div>
        }
      />
      <div className="space-y-6">
        {preferences.order.map((id) => renderWidget(id))}
      </div>
    </div>
  );
}
