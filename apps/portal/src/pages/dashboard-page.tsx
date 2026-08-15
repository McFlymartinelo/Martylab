import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Blocks } from "lucide-react";
import { usePluginsQuery } from "@/features/plugins/use-plugins-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { AppIcon } from "@/components/dashboard/app-icon";
import { HomeLightsPanel } from "@/components/dashboard/home-lights-panel";
import { HomePanel } from "@/components/dashboard/home-panel";
import { ImmichPanel } from "@/components/dashboard/immich-panel";
import { JellyfinPanel } from "@/components/dashboard/jellyfin-panel";
import { MatchdayPanel } from "@/components/dashboard/matchday-panel";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";
import { AssistantPanel } from "@/pages/assistant-page";

const SystemPanel = lazy(() =>
  import("@/components/dashboard/system-panel").then((module) => ({
    default: module.SystemPanel,
  })),
);

export function DashboardPage() {
  const pluginsQuery = usePluginsQuery();
  const apps = pluginsQuery.data?.plugins.slice(0, 6) ?? [];

  return (
    <div className="space-y-6">
      <RecentActivityPanel />

      <AssistantPanel />

      <HomePanel />
      <HomeLightsPanel />

      <MatchdayPanel />
      <ImmichPanel />
      <JellyfinPanel />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Applications
          </h2>
          <Button variant="ghost" size="sm" render={<Link to="/apps" />}>
            Voir toutes →
          </Button>
        </div>

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
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Blocks className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Aucune application enregistrée pour le moment.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {apps.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {apps.map((plugin) => (
              <Card key={plugin.id}>
                <CardContent className="flex items-center gap-3">
                  <AppIcon name={plugin.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {plugin.name}
                    </p>
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

      <Suspense
        fallback={
          <Card className="h-64 animate-pulse">
            <CardContent className="h-full" />
          </Card>
        }
      >
        <SystemPanel />
      </Suspense>
    </div>
  );
}
