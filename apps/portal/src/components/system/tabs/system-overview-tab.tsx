import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Container,
  Clock,
  Database,
  MemoryStick,
} from "lucide-react";
import { useDockerContainersQuery } from "@/features/docker/use-docker-query";
import {
  useSystemLiveQuery,
  useSystemOverviewQuery,
} from "@/features/system/use-system-metrics-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsiblePanel } from "@/components/cockpit/collapsible-panel";
import { DataTable, type DataTableColumn } from "@/components/cockpit/data-table";
import { InlineEmpty, Unavailable } from "@/components/cockpit/feedback";
import { KeyValueList } from "@/components/cockpit/key-value-list";
import { MetricLine } from "@/components/cockpit/metric-line";
import { Panel } from "@/components/cockpit/panel";
import { HealthHero } from "@/components/dashboard/health-hero";
import { InfrastructurePanels } from "@/components/system/infrastructure-panels";
import { formatBytes, formatIsoDate } from "@/lib/format";
import { containerStateVariant } from "@/lib/docker-state";
import type { DockerContainerSummary } from "@martylab/shared";

export function SystemOverviewTab() {
  const metricsQuery = useSystemLiveQuery(1_000);
  const overviewQuery = useSystemOverviewQuery();
  const dockerQuery = useDockerContainersQuery();

  const metrics = metricsQuery.data;
  const overview = overviewQuery.data;
  const containers = dockerQuery.data?.available
    ? dockerQuery.data.containers
    : [];

  const containerColumns: DataTableColumn<DockerContainerSummary>[] = [
    {
      id: "name",
      header: "Conteneur",
      render: (container) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{container.name}</p>
          <p className="truncate text-2xs text-muted-foreground">
            {container.status}
          </p>
        </div>
      ),
    },
    {
      id: "state",
      header: "État",
      render: (container) => (
        <Badge variant={containerStateVariant(container.state)}>
          {container.state}
        </Badge>
      ),
    },
    {
      id: "image",
      header: "Image",
      mono: true,
      render: (container) => (
        <span className="block max-w-52 truncate">{container.image}</span>
      ),
      hideOnMobile: true,
    },
    {
      id: "id",
      header: "ID",
      mono: true,
      hideOnMobile: true,
      render: (container) => container.id.slice(0, 12),
    },
  ];

  return (
    <div className="space-y-4">
      {metrics ? (
        <HealthHero
          metrics={metrics}
          containers={
            dockerQuery.data?.available
              ? {
                  running: containers.filter((c) => c.state === "running").length,
                  total: containers.length,
                }
              : undefined
          }
        />
      ) : metricsQuery.isError ? (
        <InlineEmpty
          icon={Activity}
          title="Métriques indisponibles"
          description="Le backend n'a pas pu lire /proc. En développement Windows, utilise le conteneur Docker ou le serveur Debian."
        />
      ) : (
        <div
          className="h-64 animate-pulse rounded-xl border border-border bg-card"
          aria-hidden="true"
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Charge 1/5/15" icon={Activity}>
          {overview?.load ? (
            <>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {overview.load.one.toFixed(2)} · {overview.load.five.toFixed(2)} ·{" "}
                {overview.load.fifteen.toFixed(2)}
              </p>
              <p className="mt-1 text-2xs text-muted-foreground">
                {overview.load.runningProcesses} en cours ·{" "}
                {overview.load.totalProcesses} processus au total
              </p>
            </>
          ) : (
            <Unavailable
              label="Charge moyenne"
              reason="Fichier /proc/loadavg illisible depuis le backend."
            />
          )}
        </Panel>

        <Panel title="Swap" icon={Database}>
          {overview?.swap ? (
            <MetricLine
              label="Utilisé"
              value={`${formatBytes(overview.swap.usedBytes)} / ${formatBytes(overview.swap.totalBytes)}`}
              percent={
                overview.swap.totalBytes > 0
                  ? (overview.swap.usedBytes / overview.swap.totalBytes) * 100
                  : 0
              }
            />
          ) : (
            <Unavailable
              label="Swap"
              reason="Aucun swap actif ou /proc/meminfo illisible."
            />
          )}
        </Panel>

        <Panel title="Démarrage" icon={Clock}>
          {overview?.facts.bootTime ? (
            <>
              <p className="text-sm font-medium tabular-nums">
                {formatIsoDate(overview.facts.bootTime)}
              </p>
              <p className="mt-1 text-2xs text-muted-foreground">
                Lu dans /proc/stat (btime)
              </p>
            </>
          ) : (
            <Unavailable
              label="Dernier démarrage"
              reason="btime absent de /proc/stat."
            />
          )}
        </Panel>

        <Panel title="Conteneurs" icon={Container}>
          {dockerQuery.data?.available ? (
            <>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {containers.filter((c) => c.state === "running").length}
                <span className="text-sm text-muted-foreground">
                  {" "}
                  / {containers.length}
                </span>
              </p>
              <p className="mt-1 text-2xs text-muted-foreground">
                en cours d&apos;exécution
              </p>
            </>
          ) : (
            <Unavailable
              label="Docker"
              reason="Connecteur Docker non configuré (DOCKER_SOCKET_PATH)."
            />
          )}
        </Panel>
      </div>

      <CollapsiblePanel
        panelId="system:containers"
        title="Conteneurs"
        icon={Container}
        hint={dockerQuery.data?.available ? `${containers.length} au total` : undefined}
        action={
          <Button variant="ghost" size="sm" render={<Link to="/services" />}>
            Gérer
            <ArrowRight aria-hidden="true" />
          </Button>
        }
        bodyClassName="p-0"
      >
        {dockerQuery.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">
            Chargement des conteneurs…
          </p>
        ) : dockerQuery.isError ? (
          <div className="p-4">
            <Unavailable
              label="Conteneurs"
              reason="Le connecteur Docker n'a pas pu être joint."
            />
          </div>
        ) : dockerQuery.data && !dockerQuery.data.available ? (
          <div className="p-4">
            <Unavailable
              label="Conteneurs"
              reason="Monte /var/run/docker.sock et définis DOCKER_SOCKET_PATH pour activer cette section."
            />
          </div>
        ) : (
          <DataTable
            columns={containerColumns}
            rows={containers}
            rowKey={(container) => container.id}
            caption="Conteneurs Docker du serveur"
            emptyMessage="Aucun conteneur Docker détecté."
            className="p-2"
          />
        )}
      </CollapsiblePanel>

      <InfrastructurePanels />

      <Panel title="Faits système" icon={MemoryStick} hint="os / /proc">
        {overview ? (
          <KeyValueList
            items={[
              { label: "Hôte", value: overview.facts.hostname ?? "—", mono: true },
              { label: "Système", value: overview.facts.os ?? "Non disponible" },
              { label: "Noyau", value: overview.facts.kernel ?? "—", mono: true },
              {
                label: "Architecture",
                value: overview.facts.architecture ?? "—",
                mono: true,
              },
              {
                label: "Processeur",
                value: overview.facts.cpuModel ?? "Non disponible",
              },
              {
                label: "Governor",
                value: overview.facts.governor ?? "Non disponible",
                mono: true,
              },
              { label: "Source", value: overview.source === "host" ? "serveur hôte" : "conteneur backend" },
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {overviewQuery.isError
              ? "Faits système indisponibles."
              : "Chargement des faits système…"}
          </p>
        )}
      </Panel>
    </div>
  );
}
