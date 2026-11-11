import { Cpu, ListOrdered, Users } from "lucide-react";
import type { SystemProcessEntry } from "@martylab/shared";
import {
  useSystemMetricsQuery,
  useSystemOverviewQuery,
} from "@/features/system/use-system-metrics-query";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/cockpit/data-table";
import { InlineEmpty, Unavailable } from "@/components/cockpit/feedback";
import { Panel } from "@/components/cockpit/panel";
import { formatBytes, formatPercent, formatRate } from "@/lib/format";

function processStateVariant(
  state: string,
): "success" | "secondary" | "outline" | "destructive" {
  if (state === "R") return "success";
  if (state === "S" || state === "D") return "secondary";
  if (state === "Z") return "destructive";
  return "outline";
}

function processStateLabel(state: string): string {
  switch (state) {
    case "R":
      return "actif";
    case "S":
      return "veille";
    case "D":
      return "I/O";
    case "Z":
      return "zombie";
    case "T":
      return "arrêté";
    default:
      return state;
  }
}

export function SystemProcessesTab() {
  const metricsQuery = useSystemMetricsQuery();
  const overviewQuery = useSystemOverviewQuery();

  const processes = metricsQuery.data?.processes ?? [];
  const load = overviewQuery.data?.load;

  const columns: DataTableColumn<SystemProcessEntry>[] = [
    {
      id: "pid",
      header: "PID",
      mono: true,
      render: (process) => process.pid,
    },
    {
      id: "name",
      header: "Processus",
      render: (process) => (
        <p className="truncate font-medium">{process.name}</p>
      ),
    },
    {
      id: "uid",
      header: "UID",
      mono: true,
      hideOnMobile: true,
      render: (process) => process.uid ?? "—",
    },
    {
      id: "memory",
      header: "Mémoire",
      mono: true,
      render: (process) => (
        <span>
          {formatBytes(process.memoryBytes)}
          <span className="ml-1 text-muted-foreground">
            ({formatPercent(process.memoryPercent)})
          </span>
        </span>
      ),
    },
    {
      id: "state",
      header: "État",
      render: (process) => (
        <Badge variant={processStateVariant(process.state)}>
          {processStateLabel(process.state)}
        </Badge>
      ),
    },
    {
      id: "cpu",
      header: "CPU (ticks)",
      mono: true,
      hideOnMobile: true,
      render: (process) => process.cpuTimeTicks ?? "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel title="Processus" icon={ListOrdered}>
          {load ? (
            <>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {formatRate(load.totalProcesses)}
              </p>
              <p className="mt-1 text-2xs text-muted-foreground">
                {load.runningProcesses} en cours d&apos;exécution
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nombre total non disponible (/proc/loadavg).
            </p>
          )}
        </Panel>

        <Panel title="Top mémoire" icon={Users}>
          {processes[0] ? (
            <>
              <p className="truncate text-sm font-medium">{processes[0].name}</p>
              <p className="mt-1 font-mono text-2xs text-muted-foreground">
                {formatBytes(processes[0].memoryBytes)} ·{" "}
                {formatPercent(processes[0].memoryPercent)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun processus lisible.
            </p>
          )}
        </Panel>

        <Panel title="Échantillon" icon={Cpu}>
          <p className="font-mono text-lg font-semibold tabular-nums">
            {processes.length}
          </p>
          <p className="mt-1 text-2xs text-muted-foreground">
            processus les plus gourmands en RAM exposés
          </p>
        </Panel>
      </div>

      <Panel title="Processus" icon={Cpu} bodyClassName="p-0">
        {metricsQuery.isError ? (
          <div className="p-4">
            <InlineEmpty
              title="Processus indisponibles"
              description="Le backend n'a pas pu lire /proc."
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={processes}
            rowKey={(process) => String(process.pid)}
            caption="Principaux processus par mémoire résidente"
            emptyMessage={
              metricsQuery.isLoading
                ? "Chargement des processus…"
                : "Aucun processus détecté."
            }
            className="p-2"
          />
        )}
      </Panel>

      <Unavailable
        label="Unités systemd"
        reason="systemctl est un processus externe (shell), volontairement non exposé. Aucun statut d'unité n'est simulé."
      />
    </div>
  );
}
