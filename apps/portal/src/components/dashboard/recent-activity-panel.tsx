import { Link } from "react-router-dom";
import { History } from "lucide-react";
import type { AssistantActionLogEntry } from "@martylab/shared";
import { useAssistantActionLogsQuery } from "@/features/assistant/use-assistant-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function actionStatusVariant(
  status: AssistantActionLogEntry["status"],
): "success" | "secondary" | "destructive" | "outline" {
  if (status === "executed") return "success";
  if (status === "denied") return "secondary";
  if (status === "failed") return "destructive";
  return "outline";
}

function formatActionLabel(entry: AssistantActionLogEntry): string {
  return entry.toolId.replaceAll(".", " · ");
}

function formatActionTime(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecentActivityPanel() {
  const logsQuery = useAssistantActionLogsQuery();
  const items = logsQuery.data?.items.slice(0, 6) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Activité récente</CardTitle>
        <Button variant="ghost" size="sm" render={<Link to="/assistant" />}>
          Voir tout →
        </Button>
      </CardHeader>
      <CardContent>
        {logsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : null}

        {logsQuery.isError ? (
          <p className="text-sm text-muted-foreground">
            Journal d&apos;activité indisponible.
          </p>
        ) : null}

        {!logsQuery.isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <History className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Aucune activité récente.
            </p>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {formatActionLabel(entry)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatActionTime(entry.createdAt)}
                  </p>
                </div>
                <Badge variant={actionStatusVariant(entry.status)}>
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
