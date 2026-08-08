import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Blocks,
  CheckCircle2,
  Cpu,
  Gauge,
  HardDrive,
  History,
} from "lucide-react";
import { useHealthQuery } from "@/features/health/use-health-query";
import { usePluginsQuery } from "@/features/plugins/use-plugins-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppIcon } from "@/components/dashboard/app-icon";
import { MetricCard } from "@/components/dashboard/metric-card";

const SystemPanel = lazy(() =>
  import("@/components/dashboard/system-panel").then((module) => ({
    default: module.SystemPanel,
  })),
);

function databaseLabel(status: string | undefined) {
  switch (status) {
    case "up":
      return "base de données en ligne";
    case "down":
      return "base de données indisponible";
    case "not_configured":
      return "base de données non configurée";
    default:
      return "état de la base inconnu";
  }
}

export function DashboardPage() {
  const healthQuery = useHealthQuery();
  const pluginsQuery = usePluginsQuery();

  const isHealthy = healthQuery.data?.status === "ok";
  const apps = pluginsQuery.data?.plugins.slice(0, 6) ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Aperçu système
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Statut général"
            icon={
              healthQuery.isLoading
                ? Gauge
                : isHealthy
                  ? CheckCircle2
                  : AlertTriangle
            }
            tone={
              healthQuery.isLoading
                ? "default"
                : isHealthy
                  ? "success"
                  : "warning"
            }
            value={
              healthQuery.isLoading
                ? "Vérification…"
                : isHealthy
                  ? "Opérationnel"
                  : "Incident"
            }
            caption={
              healthQuery.data
                ? databaseLabel(healthQuery.data.database)
                : "Backend inaccessible"
            }
          />
          <MetricCard
            label="CPU"
            icon={Cpu}
            caption="Connecteur serveur non configuré"
          />
          <MetricCard
            label="RAM"
            icon={Gauge}
            caption="Connecteur serveur non configuré"
          />
          <MetricCard
            label="Stockage"
            icon={HardDrive}
            caption="Connecteur serveur non configuré"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
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

        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <History className="size-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Aucune activité récente.
              </p>
              <p className="text-xs text-muted-foreground">
                Le journal d&apos;activité sera bientôt disponible.
              </p>
            </CardContent>
          </Card>

          <Suspense
            fallback={
              <Card className="h-64 animate-pulse">
                <CardContent className="h-full" />
              </Card>
            }
          >
            <SystemPanel />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
