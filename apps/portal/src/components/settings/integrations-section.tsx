import type { LucideIcon } from "lucide-react";
import {
  Cloud,
  Container,
  HardDrive,
  Home,
  Images,
  Layers,
  Plug,
  Tv,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrionStatusQuery } from "@/features/orion/use-orion-query";
import { useMatchdayStatusQuery } from "@/features/matchday/use-matchday-query";
import { useJellyfinStatusQuery } from "@/features/jellyfin/use-jellyfin-query";
import { useImmichStatusQuery } from "@/features/immich/use-immich-query";
import { usePortainerStatusQuery } from "@/features/portainer/use-portainer-query";
import { useCloudflareStatusQuery } from "@/features/cloudflare/use-cloudflare-query";
import { useNasStatusQuery } from "@/features/nas/use-nas-query";
import { useDockerContainersQuery } from "@/features/docker/use-docker-query";

function StatusBadge({
  configured,
  online,
}: {
  configured: boolean | undefined;
  online: boolean | undefined;
}) {
  if (configured === undefined) {
    return <Badge variant="outline">Vérification…</Badge>;
  }
  if (!configured) {
    return <Badge variant="outline">Non configuré</Badge>;
  }
  if (!online) {
    return <Badge variant="destructive">Hors ligne</Badge>;
  }
  return <Badge variant="success">Connecté</Badge>;
}

function IntegrationCard({
  icon: Icon,
  name,
  configured,
  online,
  description,
  details,
}: {
  icon: LucideIcon;
  name: string;
  configured: boolean | undefined;
  online: boolean | undefined;
  description: string;
  details: string[];
}) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="flex min-w-0 items-center gap-2">
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{name}</span>
          </CardTitle>
          <StatusBadge configured={configured} online={online} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-2xs text-muted-foreground">
        {details.length > 0 ? (
          details.map((detail) => <p key={detail}>{detail}</p>)
        ) : (
          <p>Aucun détail disponible.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function IntegrationsSection() {
  const orion = useOrionStatusQuery();
  const matchday = useMatchdayStatusQuery();
  const jellyfin = useJellyfinStatusQuery();
  const immich = useImmichStatusQuery();
  const portainer = usePortainerStatusQuery();
  const cloudflare = useCloudflareStatusQuery();
  const nas = useNasStatusQuery();
  const docker = useDockerContainersQuery();

  const dockerRunning = docker.data?.available
    ? docker.data.containers.filter((c) => c.state === "running").length
    : undefined;

  const immichDetails =
    immich.data?.instances
      .filter((instance) => instance.configured)
      .map(
        (instance) =>
          `${instance.label} : ${instance.online ? `en ligne${instance.version ? ` · v${instance.version}` : ""}` : "hors ligne"}`,
      ) ?? [];

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-2xs text-muted-foreground">
        <Plug className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Les connecteurs se configurent dans <code>.env</code> sur le serveur
          (URL + clé API). Cette page ne fait que refléter leur état réel :
          aucune clé n&apos;est affichée ni modifiable depuis le navigateur.
        </span>
      </p>

      <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        <IntegrationCard
          icon={Home}
          name="Orion"
          configured={orion.data?.configured}
          online={orion.data?.online}
          description="Domotique, capteurs et éclairages."
          details={
            orion.data?.orionUrl ? [`URL : ${orion.data.orionUrl}`] : []
          }
        />

        <IntegrationCard
          icon={Trophy}
          name="Matchday"
          configured={matchday.data?.configured}
          online={matchday.data?.online}
          description="Matchs, classement et pronostics."
          details={
            matchday.data?.online
              ? [
                  `${matchday.data.matchCount ?? "?"} matchs suivis`,
                  `${matchday.data.upcomingMatches ?? "?"} à venir`,
                ]
              : []
          }
        />

        <IntegrationCard
          icon={Tv}
          name="Jellyfin"
          configured={jellyfin.data?.configured}
          online={jellyfin.data?.online}
          description="Bibliothèque et sessions de lecture."
          details={
            jellyfin.data?.serverName
              ? [
                  jellyfin.data.serverName,
                  ...(jellyfin.data.version
                    ? [`Version ${jellyfin.data.version}`]
                    : []),
                ]
              : []
          }
        />

        <IntegrationCard
          icon={Images}
          name="Photos (Immich)"
          configured={immich.data?.anyConfigured}
          online={immich.data?.anyOnline}
          description="Bibliothèques personnelles et partagées."
          details={immichDetails}
        />

        <IntegrationCard
          icon={Layers}
          name="Portainer"
          configured={portainer.data?.configured}
          online={portainer.data?.online}
          description="Supervision de l'environnement Docker."
          details={
            portainer.data?.version
              ? [
                  `Version ${portainer.data.version}`,
                  ...(portainer.data.endpointName
                    ? [`Endpoint : ${portainer.data.endpointName}`]
                    : []),
                ]
              : []
          }
        />

        <IntegrationCard
          icon={Cloud}
          name="Cloudflare Tunnel"
          configured={cloudflare.data?.configured}
          online={cloudflare.data?.online}
          description="Accès public et domaines."
          details={
            cloudflare.data?.tunnelName
              ? [
                  `Tunnel : ${cloudflare.data.tunnelName}`,
                  ...(cloudflare.data.activeConnections !== null
                    ? [
                        `${cloudflare.data.activeConnections} connexion(s) active(s)`,
                      ]
                    : []),
                ]
              : []
          }
        />

        <IntegrationCard
          icon={HardDrive}
          name="NAS UGREEN"
          configured={nas.data?.configured}
          online={nas.data?.online}
          description="Stockage, température et pools."
          details={
            nas.data?.online
              ? [
                  ...(nas.data.deviceName ? [nas.data.deviceName] : []),
                  ...(nas.data.storagePools.length > 0
                    ? [`${nas.data.storagePools.length} pool(s) de stockage`]
                    : []),
                ]
              : []
          }
        />

        <IntegrationCard
          icon={Container}
          name="Docker"
          configured={docker.data?.available}
          online={docker.data?.available}
          description="Socket local utilisé par Services et la Console."
          details={
            docker.data?.available
              ? [
                  `${dockerRunning ?? 0} conteneur(s) en marche`,
                  `${docker.data.containers.length} au total`,
                ]
              : docker.isLoading
                ? []
                : ["Socket Docker non monté sur le backend."]
          }
        />
      </div>
    </div>
  );
}
