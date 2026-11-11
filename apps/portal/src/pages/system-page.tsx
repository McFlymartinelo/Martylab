import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { dockerContainersQueryKey } from "@/features/docker/use-docker-query";
import {
  systemMetricsQueryKey,
  useSystemMetricsQuery,
} from "@/features/system/use-system-metrics-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/cockpit/page-header";
import { SystemHardwareTab } from "@/components/system/tabs/system-hardware-tab";
import { SystemJournalTab } from "@/components/system/tabs/system-journal-tab";
import { SystemNetworkTab } from "@/components/system/tabs/system-network-tab";
import { SystemOverviewTab } from "@/components/system/tabs/system-overview-tab";
import { SystemProcessesTab } from "@/components/system/tabs/system-processes-tab";
import { SystemStorageTab } from "@/components/system/tabs/system-storage-tab";

const tabs = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "network", label: "Réseau" },
  { id: "storage", label: "Stockage" },
  { id: "processes", label: "Processus" },
  { id: "hardware", label: "Matériel" },
  { id: "journal", label: "Journal" },
] as const;

export function SystemPage() {
  const queryClient = useQueryClient();
  const metricsQuery = useSystemMetricsQuery();
  const measuredAt = metricsQuery.data?.timestamp;

  const eyebrow = measuredAt
    ? `Infrastructure · mesure à ${new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(measuredAt))}`
    : "Infrastructure · télémétrie serveur";

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["system"] });
    void queryClient.invalidateQueries({ queryKey: dockerContainersQueryKey });
    void queryClient.invalidateQueries({ queryKey: systemMetricsQueryKey });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={eyebrow}
        title="Système"
        description="Télémétrie du serveur lue en lecture seule : santé, réseau, stockage, processus, matériel et journal. Les données indisponibles sont signalées, jamais simulées."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={metricsQuery.isFetching}
          >
            <RefreshCw
              className={metricsQuery.isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
            Actualiser
          </Button>
        }
      />

      <Tabs defaultValue="overview" className="min-w-0 gap-4">
        {/* Horizontal scroller: the six labels are wider than a phone screen,
            so the strip must scroll instead of widening the page. */}
        <TabsList
          variant="line"
          className="w-full max-w-full min-w-0 justify-start overflow-x-auto pb-1"
          aria-label="Sections du système"
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-none px-2.5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <SystemOverviewTab />
        </TabsContent>
        <TabsContent value="network">
          <SystemNetworkTab />
        </TabsContent>
        <TabsContent value="storage">
          <SystemStorageTab />
        </TabsContent>
        <TabsContent value="processes">
          <SystemProcessesTab />
        </TabsContent>
        <TabsContent value="hardware">
          <SystemHardwareTab />
        </TabsContent>
        <TabsContent value="journal">
          <SystemJournalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
