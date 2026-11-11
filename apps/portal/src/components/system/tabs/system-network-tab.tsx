import { ArrowDown, ArrowUp, Cloud, Network } from "lucide-react";
import type {
  CloudflareHostnameCheck,
  SystemNetworkInterface,
} from "@martylab/shared";
import { useCloudflareStatusQuery } from "@/features/cloudflare/use-cloudflare-query";
import { useSystemMetricsQuery } from "@/features/system/use-system-metrics-query";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/cockpit/data-table";
import { InlineEmpty, Unavailable } from "@/components/cockpit/feedback";
import { KeyValueList } from "@/components/cockpit/key-value-list";
import { Panel } from "@/components/cockpit/panel";
import { Sparkline } from "@/components/dashboard/sparkline";
import { formatBytesPerSecond, formatRate } from "@/lib/format";

function peak(values: number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

export function SystemNetworkTab() {
  const metricsQuery = useSystemMetricsQuery();
  const cloudflare = useCloudflareStatusQuery();

  const network = metricsQuery.data?.network;
  const interfaces = network?.interfaces ?? [];

  const interfaceColumns: DataTableColumn<SystemNetworkInterface>[] = [
    {
      id: "name",
      header: "Interface",
      render: (iface) => <span className="font-mono text-xs">{iface.name}</span>,
    },
    {
      id: "state",
      header: "État",
      render: (iface) => (
        <Badge variant={iface.operState === "up" ? "success" : "outline"}>
          {iface.operState ?? "inconnu"}
        </Badge>
      ),
    },
    {
      id: "speed",
      header: "Débit",
      mono: true,
      render: (iface) =>
        iface.speedMbps ? `${formatRate(iface.speedMbps)} Mb/s` : "—",
      hideOnMobile: true,
    },
    {
      id: "mac",
      header: "MAC",
      mono: true,
      hideOnMobile: true,
      render: (iface) => iface.macAddress ?? "—",
    },
    {
      id: "mtu",
      header: "MTU",
      mono: true,
      hideOnMobile: true,
      render: (iface) => iface.mtu ?? "—",
    },
    {
      id: "rx",
      header: "RX/s",
      mono: true,
      render: (iface) => formatBytesPerSecond(iface.receiveBytesPerSecond),
    },
    {
      id: "tx",
      header: "TX/s",
      mono: true,
      render: (iface) => formatBytesPerSecond(iface.transmitBytesPerSecond),
    },
    {
      id: "packets",
      header: "Paquets",
      mono: true,
      hideOnMobile: true,
      render: (iface) =>
        `${formatRate(iface.receivePackets ?? 0)} / ${formatRate(iface.transmitPackets ?? 0)}`,
    },
    {
      id: "errors",
      header: "Erreurs",
      mono: true,
      hideOnMobile: true,
      render: (iface) => (
        <span
          className={
            (iface.receiveErrors ?? 0) + (iface.transmitErrors ?? 0) > 0
              ? "text-destructive"
              : undefined
          }
        >
          {(iface.receiveErrors ?? 0) + (iface.transmitErrors ?? 0)}
        </span>
      ),
    },
  ];

  const hostnameColumns: DataTableColumn<CloudflareHostnameCheck>[] = [
    {
      id: "hostname",
      header: "Hôte",
      mono: true,
      render: (entry) => <span className="text-xs">{entry.hostname}</span>,
    },
    {
      id: "status",
      header: "État",
      render: (entry) => (
        <Badge variant={entry.online ? "success" : "destructive"}>
          {entry.online ? "en ligne" : "hors ligne"}
        </Badge>
      ),
    },
    {
      id: "code",
      header: "HTTP",
      mono: true,
      hideOnMobile: true,
      render: (entry) => entry.statusCode ?? "—",
    },
    {
      id: "latency",
      header: "Latence",
      mono: true,
      render: (entry) =>
        entry.latencyMs !== null ? `${formatRate(entry.latencyMs)} ms` : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <Panel
        title="Trafic"
        icon={Network}
        hint={network ? `${network.interfaces.length} interface(s)` : undefined}
      >
        {metricsQuery.isError ? (
          <InlineEmpty
            title="Métriques réseau indisponibles"
            description="Le backend n'a pas pu lire /proc/net/dev."
          />
        ) : !network ? (
          <p className="text-sm text-muted-foreground">
            Chargement des métriques réseau…
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowDown className="size-3.5" aria-hidden="true" />
                Descendant
              </div>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {formatBytesPerSecond(network.receiveBytesPerSecond)}
              </p>
              <p className="text-2xs text-muted-foreground">
                Pic sur {network.receiveHistory.length} mesures :{" "}
                {formatBytesPerSecond(peak(network.receiveHistory))}
              </p>
              <Sparkline data={network.receiveHistory} className="h-10" />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowUp className="size-3.5" aria-hidden="true" />
                Montant
              </div>
              <p className="font-mono text-lg font-semibold tabular-nums">
                {formatBytesPerSecond(network.transmitBytesPerSecond)}
              </p>
              <p className="text-2xs text-muted-foreground">
                Pic sur {network.transmitHistory.length} mesures :{" "}
                {formatBytesPerSecond(peak(network.transmitHistory))}
              </p>
              <Sparkline data={network.transmitHistory} className="h-10" />
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Interfaces" icon={Network} bodyClassName="p-0">
        <DataTable
          columns={interfaceColumns}
          rows={interfaces}
          rowKey={(iface) => iface.name}
          caption="Interfaces réseau"
          emptyMessage="Aucune interface réseau détectée."
          className="p-2"
        />
      </Panel>

      <Panel
        title="Tunnel Cloudflare"
        icon={Cloud}
        hint={cloudflare.data?.configured ? cloudflare.data.tunnelName ?? undefined : undefined}
      >
        {!cloudflare.data ? (
          <p className="text-sm text-muted-foreground">
            {cloudflare.isError
              ? "Connecteur Cloudflare indisponible."
              : "Chargement du connecteur Cloudflare…"}
          </p>
        ) : !cloudflare.data.configured ? (
          <Unavailable
            label="Cloudflare"
            reason="Définis CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID."
          />
        ) : (
          <div className="space-y-4">
            <KeyValueList
              items={[
                {
                  label: "Tunnel",
                  value: cloudflare.data.tunnelName ?? "Non configuré",
                },
                {
                  label: "État",
                  value: cloudflare.data.tunnelStatus ?? "Non disponible",
                },
                {
                  label: "Connexions",
                  value:
                    cloudflare.data.activeConnections !== null
                      ? String(cloudflare.data.activeConnections)
                      : "Non disponible",
                  mono: true,
                },
              ]}
            />

            {cloudflare.data.hostnames.length > 0 ? (
              <DataTable
                columns={hostnameColumns}
                rows={cloudflare.data.hostnames}
                rowKey={(entry) => entry.hostname}
                caption="Hôtes publics contrôlés"
                className="rounded-lg border border-border"
              />
            ) : (
              <Unavailable
                label="Hôtes publics"
                reason="Ajoute CLOUDFLARE_CHECK_HOSTNAMES pour tester les domaines."
              />
            )}
          </div>
        )}
      </Panel>

      <Unavailable
        label="Ports en écoute"
        reason="L'inventaire fiable (ss -tulpn) nécessite un shell, volontairement non exposé au backend. Aucune valeur simulée n'est affichée."
      />
    </div>
  );
}
