import { ScrollText, ShieldAlert, SquareTerminal, Terminal } from "lucide-react";
import { PageHeader } from "@/components/cockpit/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandConsole } from "@/components/console/command-console";
import { ConsoleAuditTable } from "@/components/console/console-audit-table";
import { ContainerTerminal } from "@/components/console/container-terminal";
import { useConsoleCommandsQuery } from "@/features/console/use-console-query";

export function ConsolePage() {
  const commandsQuery = useConsoleCommandsQuery();
  const terminalEnabled = commandsQuery.data?.terminalEnabled ?? false;
  const commandsCount = commandsQuery.data?.commands.length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Infrastructure · Console"
        title="Console"
        description="Deux niveaux d'accès : des commandes typées, validées et journalisées côté serveur, et un terminal interactif limité aux conteneurs Docker, protégé par un second facteur. Réservé aux administrateurs."
        actions={
          <Badge variant="outline">
            <ShieldAlert className="size-3" aria-hidden="true" />
            admin uniquement
          </Badge>
        }
      />

      <Tabs defaultValue="commands" className="min-w-0 gap-4">
        <TabsList
          variant="line"
          className="w-full max-w-full min-w-0 justify-start overflow-x-auto pb-1"
          aria-label="Modes de la console"
        >
          <TabsTrigger value="commands" className="flex-none px-2.5">
            <SquareTerminal className="size-3.5" aria-hidden="true" />
            Commandes
            {commandsCount !== undefined ? (
              <span className="font-mono text-2xs text-muted-foreground">
                {commandsCount}
              </span>
            ) : null}
          </TabsTrigger>
          {terminalEnabled ? (
            <TabsTrigger value="terminal" className="flex-none px-2.5">
              <Terminal className="size-3.5" aria-hidden="true" />
              Terminal
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="audit" className="flex-none px-2.5">
            <ScrollText className="size-3.5" aria-hidden="true" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commands">
          <CommandConsole />
        </TabsContent>

        {terminalEnabled ? (
          <TabsContent value="terminal">
            <ContainerTerminal />
          </TabsContent>
        ) : null}

        <TabsContent value="audit">
          <ConsoleAuditTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
