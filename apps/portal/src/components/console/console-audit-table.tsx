import type { ConsoleAuditEntry, ConsoleAuditStatus } from "@martylab/shared";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/cockpit/data-table";
import { useConsoleAuditQuery } from "@/features/console/use-console-query";
import { formatIsoDate } from "@/lib/format";

const statusLabel: Record<ConsoleAuditStatus, string> = {
  success: "succès",
  error: "erreur",
  refused: "refusée",
  pending_confirmation: "à confirmer",
};

const statusVariant: Record<
  ConsoleAuditStatus,
  "success" | "destructive" | "warn" | "outline"
> = {
  success: "success",
  error: "destructive",
  refused: "warn",
  pending_confirmation: "outline",
};

export function ConsoleAuditTable() {
  const auditQuery = useConsoleAuditQuery();
  const entries = auditQuery.data?.entries ?? [];

  const columns: DataTableColumn<ConsoleAuditEntry>[] = [
    {
      id: "createdAt",
      header: "Date",
      mono: true,
      render: (entry) => formatIsoDate(entry.createdAt),
    },
    {
      id: "username",
      header: "Compte",
      render: (entry) => entry.username,
    },
    {
      id: "command",
      header: "Commande",
      mono: true,
      render: (entry) => (
        <span className="block max-w-80 truncate" title={entry.command}>
          {entry.command}
        </span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      render: (entry) => (
        <Badge variant={statusVariant[entry.status]}>
          {statusLabel[entry.status] ?? entry.status}
        </Badge>
      ),
    },
    {
      id: "risk",
      header: "Risque",
      hideOnMobile: true,
      render: (entry) => (
        <span className="font-mono text-xs text-muted-foreground">
          {entry.risk}
        </span>
      ),
    },
    {
      id: "output",
      header: "Aperçu",
      hideOnMobile: true,
      render: (entry) => (
        <span className="block max-w-72 truncate text-2xs text-muted-foreground">
          {entry.outputPreview ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Chaque exécution, refus et confirmation est journalisée côté serveur.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void auditQuery.refetch()}
          disabled={auditQuery.isFetching}
        >
          <RefreshCw
            className={auditQuery.isFetching ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
          Actualiser
        </Button>
      </div>

      {auditQuery.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Le journal d&apos;audit est indisponible.
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={entries}
          rowKey={(entry) => entry.id}
          caption="Journal d'audit de la console"
          emptyMessage="Aucune commande exécutée pour le moment."
        />
      )}
    </div>
  );
}
