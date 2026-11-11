import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Blocks,
  RefreshCw,
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={todayEyebrow()}
        title={`Bonjour ${firstName(user?.displayName)}.`}
        description="L'état réel de ton laboratoire, sans données simulées."
        actions={
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
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
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
            <div
              className="h-full min-h-52 animate-pulse rounded-xl border border-border bg-card"
              aria-hidden="true"
            />
          )}
        </div>

        <TodayPanel />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium">Assistant Martylab</p>
              <p className="text-xs text-muted-foreground">
                Outils explicites, permissions par rôle et confirmation des
                actions sensibles.
              </p>
            </div>
          </div>
          <Button variant="secondary" render={<Link to="/assistant" />}>
            Ouvrir l&apos;assistant
            <ArrowRight aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <SectionHeading icon={Blocks} title="Univers" />
        <HomePanel />
        <HomeLightsPanel />
        <MatchdayPanel />
        <ImmichPanel />
        <JellyfinPanel />
      </section>

      <section className="space-y-4">
        <RecentActivityPanel />
      </section>

      <section className="space-y-4">
        <SectionHeading
          icon={Blocks}
          title="Applications"
          action={
            <Button variant="ghost" size="sm" render={<Link to="/apps" />}>
              Registre →
            </Button>
          }
        />

        {pluginsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">
            Chargement des applications…
          </p>
        ) : null}

        {pluginsQuery.isError ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Le registre de plugins (<code>/api/plugins</code>) est
              indisponible pour le moment.
            </CardContent>
          </Card>
        ) : null}

        {pluginsQuery.data && apps.length === 0 ? (
          <InlineEmpty
            icon={Blocks}
            title="Aucune application enregistrée"
            description="Le registre de plugins est vide pour le moment."
          />
        ) : null}

        {apps.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {apps.map((plugin) => (
              <Card key={plugin.id}>
                <CardContent className="flex items-center gap-3">
                  <AppIcon name={plugin.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{plugin.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      v{plugin.version}
                    </p>
                  </div>
                  <Badge variant={plugin.enabled ? "success" : "outline"}>
                    {plugin.enabled ? "Actif" : "Inactif"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
