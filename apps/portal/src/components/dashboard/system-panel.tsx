import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CapacityBarList } from "@/components/dashboard/capacity-bar";
import { GaugeDial } from "@/components/dashboard/gauge-dial";
import { Sparkline } from "@/components/dashboard/sparkline";
import {
  useSystemMetricsQuery,
  useSystemNetworkQuery,
  useSystemProcessesQuery,
} from "@/features/system/use-system-metrics-query";
import {
  formatBytes,
  formatBytesPerSecond,
  formatPercent,
  formatTemperature,
} from "@/lib/format";
import type {
  SystemNetworkInterface,
  SystemProcessEntry,
} from "@martylab/shared";
import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

function processStateLabel(state: string): string {
  switch (state) {
    case "R":
      return "Actif";
    case "S":
      return "Veille";
    case "D":
      return "I/O";
    case "Z":
      return "Zombie";
    case "T":
      return "Arrêté";
    default:
      return state;
  }
}

export function SystemPanel() {
  const [activeTab, setActiveTab] = useState("resources");
  const metricsQuery = useSystemMetricsQuery();
  const networkQuery = useSystemNetworkQuery(activeTab === "network");
  const processesQuery = useSystemProcessesQuery(activeTab === "processes");
  const metrics = metricsQuery.data;
  const network = networkQuery.data;
  const processes = processesQuery.data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Système</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="disks">Disques</TabsTrigger>
            <TabsTrigger value="network">Réseau</TabsTrigger>
            <TabsTrigger value="processes">Processus</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="mt-4 space-y-4">
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
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <GaugeDial
                    label="CPU"
                    value={metrics.cpu.usagePercent}
                    caption={`${metrics.cpu.cores} cœurs`}
                    size={96}
                  />
                  <GaugeDial
                    label="Mémoire"
                    value={metrics.memory.usagePercent}
                    caption={`${formatBytes(metrics.memory.usedBytes)} / ${formatBytes(metrics.memory.totalBytes)}`}
                    size={96}
                  />
                  <GaugeDial
                    label="Stockage"
                    value={metrics.storage.usagePercent}
                    caption={`${formatBytes(metrics.storage.usedBytes)} / ${formatBytes(metrics.storage.totalBytes)}`}
                    size={96}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      CPU — historique
                    </p>
                    <Sparkline data={metrics.cpu.history} className="mt-2 h-12" />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Température
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">
                      {formatTemperature(metrics.temperatureCelsius)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Source :{" "}
                  {metrics.source === "host"
                    ? "serveur hôte"
                    : "conteneur backend"}
                </p>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="disks" className="mt-4">
            {metrics ? (
              <CapacityBarList
                volumes={[
                  {
                    label:
                      metrics.storage.path === "/"
                        ? "Racine (/)"
                        : metrics.storage.path,
                    usedBytes: metrics.storage.usedBytes,
                    totalBytes: metrics.storage.totalBytes,
                    usagePercent: metrics.storage.usagePercent,
                  },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Chargement des disques…
              </p>
            )}
          </TabsContent>

          <TabsContent value="network" className="mt-4 space-y-4">
            {networkQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Mesure du débit réseau…
              </p>
            ) : null}

            {networkQuery.isError ? (
              <p className="text-sm text-destructive">
                Impossible de lire les statistiques réseau.
              </p>
            ) : null}

            {network ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowDown className="size-3.5" aria-hidden="true" />
                      Réception
                    </div>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatBytesPerSecond(network.receiveBytesPerSecond)}
                    </p>
                    <Sparkline
                      data={network.receiveHistory}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowUp className="size-3.5" aria-hidden="true" />
                      Émission
                    </div>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatBytesPerSecond(network.transmitBytesPerSecond)}
                    </p>
                    <Sparkline
                      data={network.transmitHistory}
                      className="h-10"
                    />
                  </div>
                </div>

                {network.interfaces.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Interfaces
                    </p>
                    <div className="space-y-2">
                      {network.interfaces.map((iface: SystemNetworkInterface) => (
                        <div
                          key={iface.name}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                        >
                          <span className="font-medium">{iface.name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            ↓ {formatBytesPerSecond(iface.receiveBytesPerSecond)}{" "}
                            · ↑ {formatBytesPerSecond(iface.transmitBytesPerSecond)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune interface réseau détectée.
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Mesure via <code>/proc/net/dev</code> · source{" "}
                  {network.source === "host" ? "hôte" : "conteneur"}
                </p>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="processes" className="mt-4 space-y-3">
            {processesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                Lecture des processus…
              </p>
            ) : null}

            {processesQuery.isError ? (
              <p className="text-sm text-destructive">
                Impossible de lire la liste des processus.
              </p>
            ) : null}

            {processes ? (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Processus</th>
                        <th className="px-3 py-2 font-medium">PID</th>
                        <th className="px-3 py-2 font-medium">RAM</th>
                        <th className="px-3 py-2 font-medium">État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processes.processes.map((process: SystemProcessEntry) => (
                        <tr
                          key={process.pid}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="max-w-[10rem] truncate px-3 py-2 font-medium">
                            {process.name}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {process.pid}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {formatBytes(process.memoryBytes)}
                            <span className="ml-1 text-muted-foreground">
                              ({formatPercent(process.memoryPercent)})
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {processStateLabel(process.state)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {processes.processes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun processus détecté.
                  </p>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  Top processus par RAM via <code>/proc</code> · source{" "}
                  {processes.source === "host" ? "hôte" : "conteneur"}
                </p>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
