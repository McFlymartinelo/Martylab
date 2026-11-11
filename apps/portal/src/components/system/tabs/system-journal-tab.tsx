import { Link } from "react-router-dom";
import { ArrowRight, Clock, FileText } from "lucide-react";
import { useSystemOverviewQuery } from "@/features/system/use-system-metrics-query";
import { Button } from "@/components/ui/button";
import { Unavailable } from "@/components/cockpit/feedback";
import { KeyValueList } from "@/components/cockpit/key-value-list";
import { Panel } from "@/components/cockpit/panel";
import { InlineEmpty } from "@/components/cockpit/feedback";
import { formatIsoDate } from "@/lib/format";

export function SystemJournalTab() {
  const overviewQuery = useSystemOverviewQuery();
  const facts = overviewQuery.data?.facts;

  return (
    <div className="space-y-4">
      <InlineEmpty
        icon={FileText}
        title="Journal système non exposé"
        description="Lire journald demande journalctl (processus externe) ou une bibliothèque privilégiée. Conformément à la règle « pas de shell arbitraire », Martylab n'expose pas cette lecture. Aucune ligne de journal n'est simulée."
      />

      <Panel title="Dernier démarrage" icon={Clock} hint="/proc/stat">
        {facts?.bootTime ? (
          <KeyValueList
            items={[
              { label: "Démarrage", value: formatIsoDate(facts.bootTime) },
              { label: "Noyau", value: facts.kernel ?? "—", mono: true },
              { label: "Système", value: facts.os ?? "Non disponible" },
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {overviewQuery.isError
              ? "Information indisponible."
              : "Chargement de l'heure de démarrage…"}
          </p>
        )}
      </Panel>

      <Panel title="Alternative disponible" icon={FileText}>
        <p className="text-sm text-muted-foreground">
          Le journal des actions de l&apos;assistant (outils et confirmations)
          est, lui, persisté en base et consultable.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          render={<Link to="/assistant" />}
        >
          Ouvrir l&apos;assistant
          <ArrowRight aria-hidden="true" />
        </Button>
      </Panel>

      <Unavailable
        label="Unités en échec"
        reason="Nécessite systemctl (shell). Aucun état inventé."
      />
    </div>
  );
}
