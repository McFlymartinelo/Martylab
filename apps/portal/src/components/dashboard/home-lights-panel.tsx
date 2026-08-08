import { Lightbulb, LightbulbOff } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import {
  useOrionLightMutation,
  useOrionLightsQuery,
  useOrionStatusQuery,
} from "@/features/orion/use-orion-query";
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

export function HomeLightsPanel() {
  const authQuery = useAuthQuery();
  const statusQuery = useOrionStatusQuery();
  const lightsQuery = useOrionLightsQuery(statusQuery.data?.online === true);
  const lightMutation = useOrionLightMutation();

  const role = authQuery.data?.user?.role;
  const canControl = role ? hasMinRole(role, "user") : false;
  const configured = statusQuery.data?.configured ?? false;
  const online = statusQuery.data?.online ?? false;

  if (!configured || !online) {
    return null;
  }

  if (lightsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Chargement des lumières…
        </CardContent>
      </Card>
    );
  }

  const lights = lightsQuery.data;

  if (!lights?.available) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lumières</CardTitle>
          <CardDescription>
            Hue indisponible via Orion (bridge non configuré ou hors ligne).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (lights.lights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lumières</CardTitle>
          <CardDescription>Aucun luminaire Hue détecté sur le bridge.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Lumières</h2>
          <p className="text-xs text-muted-foreground">
            Philips Hue via Orion · {lights.lights.length} appareil
            {lights.lights.length > 1 ? "s" : ""}
          </p>
        </div>
        {!canControl ? (
          <Badge variant="outline">Lecture seule</Badge>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lights.lights.map((light) => (
          <Card key={light.id}>
            <CardContent className="space-y-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{light.name}</p>
                  <p className="text-xs text-muted-foreground">ID Hue {light.id}</p>
                </div>
                <Badge variant={light.on ? "success" : "secondary"}>
                  {light.on ? "Allumée" : "Éteinte"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {light.brightness !== null
                  ? `Luminosité ${light.brightness} %`
                  : "Luminosité inconnue"}
                {!light.reachable ? " · hors ligne" : ""}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    !canControl ||
                    !light.reachable ||
                    light.on ||
                    lightMutation.isPending
                  }
                  onClick={() =>
                    lightMutation.mutate({
                      lightId: light.id,
                      body: { on: true },
                    })
                  }
                >
                  <Lightbulb className="size-4" />
                  Allumer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    !canControl ||
                    !light.reachable ||
                    !light.on ||
                    lightMutation.isPending
                  }
                  onClick={() =>
                    lightMutation.mutate({
                      lightId: light.id,
                      body: { on: false },
                    })
                  }
                >
                  <LightbulbOff className="size-4" />
                  Éteindre
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
