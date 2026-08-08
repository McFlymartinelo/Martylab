import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemMetricsQuery } from "@/features/system/use-system-metrics-query";
import { formatBytes } from "@/lib/format";
import { RadialGauge } from "@/components/dashboard/radial-gauge";
import { Sparkline } from "@/components/dashboard/sparkline";

function ResourceTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function SystemPanel() {
  const metricsQuery = useSystemMetricsQuery();
  const metrics = metricsQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Système</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resources">
          <TabsList>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="disks">Disques</TabsTrigger>
            <TabsTrigger value="network">Réseau</TabsTrigger>
            <TabsTrigger value="processes">Processus</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="mt-4">
            {metricsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Chargement des métriques…
              </p>
            ) : null}

            {metricsQuery.isError ? (
              <p className="text-sm text-destructive">
                Impossible de charger les métriques système.
              </p>
            ) : null}

            {metrics ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <ResourceTile label="CPU">
                    <Sparkline data={metrics.cpu.history} />
                  </ResourceTile>
                  <ResourceTile label="Mémoire">
                    <RadialGauge
                      size={72}
                      value={metrics.memory.usagePercent}
                    />
                  </ResourceTile>
                  <ResourceTile label="Stockage">
                    <Progress value={metrics.storage.usagePercent}>
                      <ProgressTrack>
                        <ProgressIndicator />
                      </ProgressTrack>
                    </Progress>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(metrics.storage.usedBytes)} /{" "}
                      {formatBytes(metrics.storage.totalBytes)}
                    </p>
                  </ResourceTile>
                  <ResourceTile label="Température">
                    {metrics.temperatureCelsius !== null ? (
                      <p className="text-2xl font-semibold tabular-nums">
                        {metrics.temperatureCelsius} °C
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Capteur indisponible
                      </p>
                    )}
                  </ResourceTile>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Source :{" "}
                  {metrics.source === "host"
                    ? "serveur hôte"
                    : "conteneur backend"}
                  {metrics.temperatureCelsius === null
                    ? " · capteur de température indisponible"
                    : ` · ${metrics.temperatureCelsius} °C`}
                </p>
              </>
            ) : null}
          </TabsContent>

          <TabsContent
            value="disks"
            className="mt-4 py-6 text-center text-sm text-muted-foreground"
          >
            {metrics
              ? `${formatBytes(metrics.storage.usedBytes)} utilisés sur ${formatBytes(metrics.storage.totalBytes)} (${metrics.storage.path})`
              : "Bientôt disponible."}
          </TabsContent>
          <TabsContent
            value="network"
            className="mt-4 py-6 text-center text-sm text-muted-foreground"
          >
            Bientôt disponible.
          </TabsContent>
          <TabsContent
            value="processes"
            className="mt-4 py-6 text-center text-sm text-muted-foreground"
          >
            Bientôt disponible.
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
