import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadialGauge } from "@/components/dashboard/radial-gauge";
import { Sparkline } from "@/components/dashboard/sparkline";

function ResourceTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function SystemPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Système</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="resources">
          <TabsList>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="disks">Disques</TabsTrigger>
            <TabsTrigger value="network">Réseau</TabsTrigger>
            <TabsTrigger value="processes">Processus</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <ResourceTile label="CPU">
                <Sparkline />
              </ResourceTile>
              <ResourceTile label="Mémoire">
                <RadialGauge size={72} />
              </ResourceTile>
              <ResourceTile label="Stockage">
                <Progress value={null}>
                  <ProgressTrack>
                    <ProgressIndicator className="bg-muted-foreground/40" />
                  </ProgressTrack>
                </Progress>
                <p className="text-xs text-muted-foreground">Indisponible</p>
              </ResourceTile>
              <ResourceTile label="Température">
                <Sparkline />
              </ResourceTile>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Connecteur serveur non configuré pour le moment.
            </p>
          </TabsContent>

          <TabsContent
            value="disks"
            className="mt-4 py-6 text-center text-sm text-muted-foreground"
          >
            Bientôt disponible.
          </TabsContent>
          <TabsContent
            value="network"
            className="mt-4 py-6 text-center text-sm text-muted-foreground"
          >
            Bientôt disponible.
          </TabsContent>
          <TabsContent
            value="processes"
            className="mt-4 py-6 text-center text-sm text-muted-foreground"
          >
            Bientôt disponible.
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
