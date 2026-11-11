import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Container,
  FileText,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
} from "lucide-react";
import type { DockerContainerSummary } from "@martylab/shared";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import {
  dockerContainersQueryKey,
  useDockerContainersQuery,
} from "@/features/docker/use-docker-query";
import {
  useDockerContainerActionMutation,
  useDockerContainerLogsQuery,
} from "@/features/docker/use-docker-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsiblePanel } from "@/components/cockpit/collapsible-panel";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineEmpty, Unavailable } from "@/components/cockpit/feedback";
import { PageHeader } from "@/components/cockpit/page-header";
import { Panel } from "@/components/cockpit/panel";
import {
  containerStateLabel,
  containerStateVariant,
} from "@/lib/docker-state";
import {
  formatGroupStateSummary,
  groupContainersByApp,
} from "@/lib/docker-groups";
import { useToast } from "@/lib/use-toast";

export function ServicesPage() {
  const queryClient = useQueryClient();
  const authQuery = useAuthQuery();
  const dockerQuery = useDockerContainersQuery();
  const actionMutation = useDockerContainerActionMutation();
  const toast = useToast();
  const [logsContainer, setLogsContainer] =
    useState<DockerContainerSummary | null>(null);

  const role = authQuery.data?.user?.role;
  const canManage = role === "admin";

  const containers = dockerQuery.data?.available
    ? dockerQuery.data.containers
    : [];
  const groups = groupContainersByApp(containers);

  function runAction(
    container: DockerContainerSummary,
    action: "start" | "stop" | "restart",
  ) {
    if (
      (action === "stop" || action === "restart") &&
      !window.confirm(
        `${action === "stop" ? "Arrêter" : "Redémarrer"} le conteneur « ${container.name} » ? Cette action peut interrompre le service.`,
      )
    ) {
      return;
    }

    const labels = {
      start: "Démarrage demandé",
      stop: "Arrêt demandé",
      restart: "Redémarrage demandé",
    } as const;

    actionMutation.mutate(
      { containerId: container.id, action },
      {
        onSuccess: () => {
          toast.show({
            title: labels[action],
            description: container.name,
            type: "success",
          });
        },
        onError: () => {
          toast.show({
            title: "Action impossible",
            description: `Le serveur a refusé l'action sur ${container.name}.`,
            type: "error",
          });
        },
      },
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Infrastructure · Docker"
        title="Services"
        description="Conteneurs groupés par application. Les utilisateurs consultent l'état et les logs ; les actions Docker sont réservées aux administrateurs. Arrêter ou redémarrer demande une confirmation."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void queryClient.invalidateQueries({
                queryKey: dockerContainersQueryKey,
              })
            }
            disabled={dockerQuery.isFetching}
          >
            <RefreshCw
              className={dockerQuery.isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
            Actualiser
          </Button>
        }
      />

      {!canManage ? (
        <Panel title="Mode lecture seule" icon={Container}>
          <p className="text-sm text-muted-foreground">
            Ton compte invité peut consulter l&apos;état et les logs, mais pas
            piloter les conteneurs. La restriction est appliquée par l&apos;API.
          </p>
        </Panel>
      ) : null}

      {actionMutation.isError ? (
        <div
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          L&apos;action a échoué. Vérifie les permissions du socket Docker côté
          serveur.
        </div>
      ) : null}

      {dockerQuery.isLoading ? (
        <Panel title="Conteneurs" icon={Container}>
          <p className="text-sm text-muted-foreground">
            Chargement des conteneurs…
          </p>
        </Panel>
      ) : null}

      {dockerQuery.isError ? (
        <Panel title="Conteneurs" icon={Container}>
          <Unavailable
            label="Docker"
            reason="Le connecteur Docker n'a pas pu être joint."
          />
        </Panel>
      ) : null}

      {dockerQuery.data && !dockerQuery.data.available ? (
        <Panel title="Conteneurs" icon={Container}>
          <Unavailable
            label="Docker"
            reason="Monte /var/run/docker.sock et définis DOCKER_SOCKET_PATH (et DOCKER_GID en production)."
          />
        </Panel>
      ) : null}

      {dockerQuery.data?.available && containers.length === 0 ? (
        <InlineEmpty
          icon={Container}
          title="Aucun conteneur"
          description="Aucun conteneur Docker détecté sur ce serveur."
        />
      ) : null}

      {groups.map((group) => (
        <CollapsiblePanel
          key={group.id}
          panelId={`services:${group.id}`}
          title={group.label}
          icon={Container}
          hint={`${group.containers.length} conteneur(s) · ${formatGroupStateSummary(group.containers)}`}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {group.containers.map((container) => (
              <li
                key={container.id}
                className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {container.name}
                    </p>
                    <Badge variant={containerStateVariant(container.state)}>
                      {containerStateLabel(container.state)}
                    </Badge>
                  </div>
                  <p className="truncate font-mono text-2xs text-muted-foreground">
                    {container.image} · {container.id.slice(0, 12)}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    {container.status}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || actionMutation.isPending}
                    onClick={() => runAction(container, "start")}
                  >
                    <Play className="size-3.5" aria-hidden="true" />
                    Démarrer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || actionMutation.isPending}
                    onClick={() => runAction(container, "stop")}
                  >
                    <Square className="size-3.5" aria-hidden="true" />
                    Arrêter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canManage || actionMutation.isPending}
                    onClick={() => runAction(container, "restart")}
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Redémarrer
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setLogsContainer(container)}
                  >
                    <FileText className="size-3.5" aria-hidden="true" />
                    Logs
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CollapsiblePanel>
      ))}

      <LogsDialog
        container={logsContainer}
        onClose={() => setLogsContainer(null)}
      />
    </div>
  );
}

function LogsDialog({
  container,
  onClose,
}: {
  container: DockerContainerSummary | null;
  onClose: () => void;
}) {
  const logsQuery = useDockerContainerLogsQuery(
    container?.id ?? null,
    Boolean(container),
  );

  return (
    <Dialog
      open={Boolean(container)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogBackdrop />
      <DialogPopup className="w-[min(52rem,calc(100vw-2rem))]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <DialogTitle className="truncate">
              Logs · {container?.name}
            </DialogTitle>
            <p className="truncate font-mono text-2xs text-muted-foreground">
              {container?.image}
            </p>
          </div>
          <DialogClose
            className="rounded-md px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Fermer les logs"
          >
            Fermer
          </DialogClose>
        </div>

        <div className="mt-3 max-h-[60svh] overflow-auto rounded-lg border border-border bg-muted/20 p-3">
          {logsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement des logs…
            </p>
          ) : logsQuery.isError ? (
            <p className="text-sm text-destructive">
              Impossible de charger les logs de ce conteneur.
            </p>
          ) : (
            <pre className="font-mono text-xs whitespace-pre-wrap text-foreground">
              {logsQuery.data?.logs || "Aucun log disponible."}
            </pre>
          )}
        </div>
        <p className="mt-2 text-2xs text-muted-foreground">
          100 dernières lignes lues via l&apos;API Docker côté serveur.
        </p>
      </DialogPopup>
    </Dialog>
  );
}
