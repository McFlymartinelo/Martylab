import { Container } from "lucide-react";
import { useDockerContainersQuery } from "@/features/docker/use-docker-query";
import { useSystemMetricsQuery } from "@/features/system/use-system-metrics-query";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DockerContainerGroups } from "@/components/system/docker-container-groups";
import { InfrastructurePanels } from "@/components/system/infrastructure-panels";
import { SystemInstrumentationPanel } from "@/components/system/system-instrumentation-panel";

export function SystemPage() {
  const metricsQuery = useSystemMetricsQuery();
  const dockerQuery = useDockerContainersQuery();
  const metrics = metricsQuery.data;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Système</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Supervision du serveur, de l&apos;infrastructure (Portainer, Cloudflare,
          NAS) et des conteneurs Docker.
        </p>
      </section>

      {metricsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des métriques…
        </p>
      ) : null}

      {metricsQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Métriques indisponibles</CardTitle>
            <CardDescription>
              Impossible de joindre <code>/api/system/metrics</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {metrics ? <SystemInstrumentationPanel metrics={metrics} /> : null}

      <InfrastructurePanels />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Container className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-medium text-muted-foreground">
            Conteneurs Docker
          </h2>
        </div>

        {dockerQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">
            Chargement des conteneurs…
          </p>
        ) : null}

        {dockerQuery.isError ? (
          <Card>
            <CardHeader>
              <CardTitle>Docker indisponible</CardTitle>
              <CardDescription>
                Le connecteur Docker n&apos;a pas pu être joint.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {dockerQuery.data && !dockerQuery.data.available ? (
          <Card>
            <CardHeader>
              <CardTitle>Connecteur Docker non configuré</CardTitle>
              <CardDescription>
                Monte <code>/var/run/docker.sock</code> dans le conteneur backend
                et définis <code>DOCKER_SOCKET_PATH</code> pour activer cette
                fonctionnalité.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {dockerQuery.data?.available && dockerQuery.data.containers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucun conteneur</CardTitle>
              <CardDescription>
                Aucun conteneur Docker détecté sur ce serveur.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {dockerQuery.data?.available && dockerQuery.data.containers.length > 0 ? (
          <DockerContainerGroups containers={dockerQuery.data.containers} />
        ) : null}
      </section>
    </div>
  );
}
