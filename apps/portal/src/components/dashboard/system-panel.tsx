import { ArrowDown, ArrowUp, Thermometer } from "lucide-react";
import type { SystemProcessEntry } from "@martylab/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CapacityBarList } from "@/components/dashboard/capacity-bar";
import { GaugeDial } from "@/components/dashboard/gauge-dial";
import { Sparkline } from "@/components/dashboard/sparkline";
import { useSystemMetricsQuery } from "@/features/system/use-system-metrics-query";
import {
  formatBytes,
  formatBytesPerSecond,
  formatPercent,
  formatTemperature,
} from "@/lib/format";
import { cn } from "@/lib/utils";

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

function ProcessList({ processes }: { processes: SystemProcessEntry[] }) {
  const maxMemory = processes[0]?.memoryBytes ?? 1;

  return (
    <div className="space-y-2 sm:hidden">
      {processes.map((process) => (
        <div
          key={process.pid}
          className="rounded-lg border border-border bg-muted/15 px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate font-medium">{process.name}</p>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatBytes(process.memoryBytes)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-1 transition-all"
                style={{
                  width: `${Math.max(4, (process.memoryBytes / maxMemory) * 100)}%`,
                }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
              {formatPercent(process.memoryPercent)}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            PID {process.pid} · {processStateLabel(process.state)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProcessTable({ processes }: { processes: SystemProcessEntry[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Processus</th>
            <th className="px-3 py-2 font-medium">PID</th>
            <th className="px-3 py-2 font-medium">RAM</th>
            <th className="px-3 py-2 font-medium">État</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((process) => (
            <tr
              key={process.pid}
              className="border-b border-border/60 last:border-0"
            >
              <td className="max-w-[12rem] truncate px-3 py-2 font-medium">
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
  );
}

export function SystemPanel() {
  const metricsQuery = useSystemMetricsQuery();
  const metrics = metricsQuery.data;
  const network = metrics?.network;
  const processes = metrics?.processes;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Système</CardTitle>
      </CardHeader>
      <CardContent>
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
          <Tabs defaultValue="resources">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="resources" className="text-xs sm:text-sm">
                Ressources
              </TabsTrigger>
              <TabsTrigger value="disks" className="text-xs sm:text-sm">
                Disques
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs sm:text-sm">
                Réseau
              </TabsTrigger>
              <TabsTrigger value="processes" className="text-xs sm:text-sm">
                Processus
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resources" className="mt-4 space-y-4">
              <div
                className={cn(
                  "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1",
                  "sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0",
                )}
              >
                <GaugeDial
                  label="CPU"
                  value={metrics.cpu.usagePercent}
                  caption={`${metrics.cpu.cores} cœurs`}
                  size={88}
                  compact
                  className="min-w-[5.75rem] shrink-0 sm:min-w-0"
                />
                <GaugeDial
                  label="RAM"
                  value={metrics.memory.usagePercent}
                  caption={`${formatBytes(metrics.memory.usedBytes)} / ${formatBytes(metrics.memory.totalBytes)}`}
                  size={88}
                  compact
                  className="min-w-[5.75rem] shrink-0 sm:min-w-0"
                />
                <GaugeDial
                  label="Stockage"
                  value={metrics.storage.usagePercent}
                  caption={`${formatBytes(metrics.storage.usedBytes)} / ${formatBytes(metrics.storage.totalBytes)}`}
                  size={88}
                  compact
                  className="min-w-[5.75rem] shrink-0 sm:min-w-0"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 sm:px-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    CPU — historique
                  </p>
                  <Sparkline data={metrics.cpu.history} className="mt-2 h-10 sm:h-12" />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3 sm:px-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Température serveur
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums sm:mt-2 sm:text-2xl">
                      {metrics.temperatureCelsius !== null
                        ? formatTemperature(metrics.temperatureCelsius)
                        : "Indisponible"}
                    </p>
                  </div>
                  {metrics.temperatureCelsius !== null ? (
                    <Thermometer
                      className="size-6 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Source :{" "}
                {metrics.source === "host" ? "serveur hôte" : "conteneur backend"}
              </p>
            </TabsContent>

            <TabsContent value="disks" className="mt-4">
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
            </TabsContent>

            <TabsContent value="network" className="mt-4 space-y-4">
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
                        {network.interfaces.map((iface) => (
                          <div
                            key={iface.name}
                            className="rounded-lg border border-border px-3 py-2 text-sm"
                          >
                            <p className="font-medium">{iface.name}</p>
                            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                              ↓ {formatBytesPerSecond(iface.receiveBytesPerSecond)}
                              <br className="sm:hidden" />
                              <span className="hidden sm:inline"> · </span>
                              ↑ {formatBytesPerSecond(iface.transmitBytesPerSecond)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune interface réseau détectée.
                    </p>
                  )}

                  {network.receiveBytesPerSecond === 0 &&
                  network.transmitBytesPerSecond === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Le débit sera mesuré au prochain rafraîchissement (30 s).
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Données réseau indisponibles. Redéploie le backend.
                </p>
              )}
            </TabsContent>

            <TabsContent value="processes" className="mt-4 space-y-3">
              {processes && processes.length > 0 ? (
                <>
                  <ProcessList processes={processes} />
                  <ProcessTable processes={processes} />
                  <p className="text-xs text-muted-foreground">
                    Top processus par RAM via <code>/proc</code>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {processes
                    ? "Aucun processus détecté."
                    : "Données processus indisponibles. Redéploie le backend."}
                </p>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  );
}
