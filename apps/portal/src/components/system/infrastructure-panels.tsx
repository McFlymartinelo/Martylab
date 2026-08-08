import { Cloud, HardDrive, Layers } from "lucide-react";
import { useCloudflareStatusQuery } from "@/features/cloudflare/use-cloudflare-query";
import { useNasStatusQuery } from "@/features/nas/use-nas-query";
import {
  usePortainerOverviewQuery,
  usePortainerStatusQuery,
} from "@/features/portainer/use-portainer-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBytes, formatPercent } from "@/lib/format";

function connectorBadge(configured: boolean, online: boolean) {
  if (!configured) return <Badge variant="outline">Non configuré</Badge>;
  if (!online) return <Badge variant="destructive">Hors ligne</Badge>;
  return <Badge variant="success">Connecté</Badge>;
}

export function InfrastructurePanels() {
  const portainerStatus = usePortainerStatusQuery();
  const portainerOverview = usePortainerOverviewQuery(
    portainerStatus.data?.configured === true,
  );
  const cloudflareStatus = useCloudflareStatusQuery();
  const nasStatus = useNasStatusQuery();

  const portainer = portainerStatus.data;
  const overview = portainerOverview.data;
  const cloudflare = cloudflareStatus.data;
  const nas = nasStatus.data;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Infrastructure
      </h2>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4" />
                Portainer
              </CardTitle>
              {portainer
                ? connectorBadge(portainer.configured, portainer.online)
                : null}
            </div>
            <CardDescription>
              {portainer?.version
                ? `v${portainer.version}`
                : "Gestion Docker via Portainer"}
              {portainer?.endpointName
                ? ` · ${portainer.endpointName}`
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!portainer?.configured ? (
              <p className="text-muted-foreground">
                Définis <code>PORTAINER_URL</code> et{" "}
                <code>PORTAINER_API_TOKEN</code>.
              </p>
            ) : !overview?.available ? (
              <p className="text-muted-foreground">
                Portainer joignable mais l&apos;aperçu est indisponible.
              </p>
            ) : (
              <>
                <p>
                  {overview.containers.length} conteneur(s) ·{" "}
                  {overview.images.length} image(s) ·{" "}
                  {overview.volumes.length} volume(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  {overview.containers.filter((c) => c.state === "running").length}{" "}
                  en cours d&apos;exécution
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cloud className="size-4" />
                Cloudflare
              </CardTitle>
              {cloudflare
                ? connectorBadge(cloudflare.configured, cloudflare.online)
                : null}
            </div>
            <CardDescription>
              {cloudflare?.tunnelName ?? "Tunnel et domaines publics"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!cloudflare?.configured ? (
              <p className="text-muted-foreground">
                Définis <code>CLOUDFLARE_API_TOKEN</code> et{" "}
                <code>CLOUDFLARE_ACCOUNT_ID</code>.
              </p>
            ) : (
              <>
                {cloudflare.tunnelStatus ? (
                  <p>
                    Tunnel : {cloudflare.tunnelStatus}
                    {cloudflare.activeConnections !== null
                      ? ` · ${cloudflare.activeConnections} connexion(s)`
                      : null}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Ajoute <code>CLOUDFLARE_TUNNEL_ID</code> pour le détail du
                    tunnel.
                  </p>
                )}
                {cloudflare.hostnames.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {cloudflare.hostnames.map((entry) => (
                      <li key={entry.hostname}>
                        {entry.hostname} —{" "}
                        {entry.online
                          ? `OK (${entry.statusCode})`
                          : "indisponible"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Ajoute <code>CLOUDFLARE_CHECK_HOSTNAMES</code> pour tester
                    tes domaines.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="size-4" />
                NAS UGREEN
              </CardTitle>
              {nas ? connectorBadge(nas.configured, nas.online) : null}
            </div>
            <CardDescription>
              {nas?.deviceName ?? "Stockage et santé du NAS"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!nas?.configured ? (
              <p className="text-muted-foreground">
                Définis <code>NAS_URL</code> et <code>NAS_API_TOKEN</code>.
              </p>
            ) : !nas.online ? (
              <p className="text-muted-foreground">
                Impossible de joindre le NAS (vérifie le token UGOS).
              </p>
            ) : (
              <>
                {nas.cpuUsagePercent !== null || nas.ramUsagePercent !== null ? (
                  <p>
                    {nas.cpuUsagePercent !== null
                      ? `CPU ${nas.cpuUsagePercent}%`
                      : null}
                    {nas.cpuUsagePercent !== null &&
                    nas.ramUsagePercent !== null
                      ? " · "
                      : null}
                    {nas.ramUsagePercent !== null
                      ? `RAM ${nas.ramUsagePercent}%`
                      : null}
                    {nas.cpuTemperatureCelsius !== null
                      ? ` · ${nas.cpuTemperatureCelsius} °C`
                      : null}
                  </p>
                ) : null}
                {nas.storagePools.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {nas.storagePools.map((pool) => (
                      <li key={pool.name}>
                        {pool.label ?? pool.name} —{" "}
                        {formatPercent(pool.usagePercent)} (
                        {formatBytes(pool.usedBytes)} /{" "}
                        {formatBytes(pool.totalBytes)})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aucun pool de stockage remonté.
                  </p>
                )}
                {nas.disks.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {nas.disks.length} disque(s) monitoré(s)
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
