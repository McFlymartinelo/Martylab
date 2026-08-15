import { ChevronRight } from "lucide-react";
import type { DockerContainerSummary } from "@martylab/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatGroupStateSummary,
  groupContainersByApp,
} from "@/lib/docker-groups";
import { cn } from "@/lib/utils";

function containerStateVariant(
  state: string,
): "success" | "secondary" | "outline" | "destructive" {
  if (state === "running") return "success";
  if (state === "exited") return "secondary";
  if (state === "paused") return "outline";
  return "destructive";
}

function ContainerRow({ container }: { container: DockerContainerSummary }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium">{container.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {container.image} · {container.id}
        </p>
        <p className="text-xs text-muted-foreground">{container.status}</p>
      </div>
      <Badge variant={containerStateVariant(container.state)}>
        {container.state}
      </Badge>
    </div>
  );
}

interface DockerContainerGroupsProps {
  containers: DockerContainerSummary[];
}

export function DockerContainerGroups({ containers }: DockerContainerGroupsProps) {
  const groups = groupContainersByApp(containers);

  return (
    <div className="grid gap-3">
      {groups.map((group) => {
        const isSingle = group.containers.length === 1;
        const summary = formatGroupStateSummary(group.containers);

        if (isSingle) {
          const container = group.containers[0]!;
          return (
            <Card key={group.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
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
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={group.id} className="overflow-hidden">
            <details className="group">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-3 px-4 py-4",
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                  aria-hidden="true"
                />
                <p className="min-w-0 font-medium">
                  {group.label}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {summary}
                  </span>
                </p>
              </summary>

              <CardContent className="space-y-2 border-t border-border pt-3 pb-4">
                {group.containers.map((container) => (
                  <ContainerRow key={container.id} container={container} />
                ))}
              </CardContent>
            </details>
          </Card>
        );
      })}
    </div>
  );
}
