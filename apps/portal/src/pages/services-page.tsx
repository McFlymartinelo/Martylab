import { useState } from "react";
import { FileText, Play, RotateCcw, Square } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { useDockerContainersQuery } from "@/features/docker/use-docker-query";
import {
  useDockerContainerActionMutation,
  useDockerContainerLogsQuery,
} from "@/features/docker/use-docker-actions";
import { hasMinRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function containerStateVariant(
  state: string,
): "success" | "secondary" | "outline" | "destructive" {
  if (state === "running") return "success";
  if (state === "exited") return "secondary";
  if (state === "paused") return "outline";
  return "destructive";
}

export function ServicesPage() {
  const authQuery = useAuthQuery();
  const dockerQuery = useDockerContainersQuery();
  const actionMutation = useDockerContainerActionMutation();
  const [logsContainerId, setLogsContainerId] = useState<string | null>(null);
  const logsQuery = useDockerContainerLogsQuery(logsContainerId, Boolean(logsContainerId));

  const role = authQuery.data?.user?.role;
  const canManage = role ? hasMinRole(role, "user") : false;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Gestion des conteneurs Docker du serveur. Les invités peuvent
          consulter l&apos;état et les logs ; les actions nécessitent le rôle
          utilisateur ou administrateur.
        </p>
      </section>

      {!canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Mode lecture seule</CardTitle>
            <CardDescription>
              Ton compte invité ne peut pas démarrer, arrêter ou redémarrer des
              conteneurs.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {dockerQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des conteneurs…
        </p>
      ) : null}

      {dockerQuery.data && !dockerQuery.data.available ? (
        <Card>
          <CardHeader>
            <CardTitle>Connecteur Docker non configuré</CardTitle>
            <CardDescription>
              Monte <code>/var/run/docker.sock</code> et définis{" "}
              <code>DOCKER_GID</code> dans le <code>.env</code> de production.
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

      {dockerQuery.data?.available ? (
        <div className="grid gap-3">
          {dockerQuery.data.containers.map((container) => (
            <Card key={container.id}>
              <CardContent className="space-y-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{container.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {container.image} · {container.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {container.status}
                    </p>
                  </div>
                  <Badge variant={containerStateVariant(container.state)}>
                    {container.state}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || actionMutation.isPending}
                    onClick={() =>
                      actionMutation.mutate({
                        containerId: container.id,
                        action: "start",
                      })
                    }
                  >
                    <Play className="size-3.5" aria-hidden="true" />
                    Démarrer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || actionMutation.isPending}
                    onClick={() =>
                      actionMutation.mutate({
                        containerId: container.id,
                        action: "stop",
                      })
                    }
                  >
                    <Square className="size-3.5" aria-hidden="true" />
                    Arrêter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || actionMutation.isPending}
                    onClick={() =>
                      actionMutation.mutate({
                        containerId: container.id,
                        action: "restart",
                      })
                    }
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Redémarrer
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setLogsContainerId(
                        logsContainerId === container.id ? null : container.id,
                      )
                    }
                  >
                    <FileText className="size-3.5" aria-hidden="true" />
                    Logs
                  </Button>
                </div>

                {logsContainerId === container.id ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    {logsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Chargement des logs…
                      </p>
                    ) : null}
                    {logsQuery.isError ? (
                      <p className="text-sm text-destructive">
                        Impossible de charger les logs.
                      </p>
                    ) : null}
                    {logsQuery.data ? (
                      <pre className="max-h-64 overflow-auto text-xs whitespace-pre-wrap">
                        {logsQuery.data.logs || "Aucun log disponible."}
                      </pre>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {actionMutation.isError ? (
        <p className="text-sm text-destructive">
          L&apos;action Docker a échoué. Vérifie les permissions du socket.
        </p>
      ) : null}
    </div>
  );
}
