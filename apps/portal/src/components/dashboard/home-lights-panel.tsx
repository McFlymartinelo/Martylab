import { Lightbulb, LightbulbOff } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import {
  useOrionLightMutation,
  useOrionLightsQuery,
  useOrionStatusQuery,
} from "@/features/orion/use-orion-query";
import { hasMinRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const onCount = lights.lights.filter((light) => light.on).length;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Lumières</h2>
          <p className="text-xs text-muted-foreground">
            Philips Hue · {onCount}/{lights.lights.length} allumée
            {onCount > 1 ? "s" : ""}
          </p>
        </div>
        {!canControl ? (
          <Badge variant="outline">Lecture seule</Badge>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="divide-y divide-border p-0">
          {lights.lights.map((light) => {
            const disabled =
              !canControl || !light.reachable || lightMutation.isPending;

            return (
              <div
                key={light.id}
                className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3"
              >
                <button
                  type="button"
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
                    light.on
                      ? "bg-chart-1/20 text-chart-1"
                      : "bg-muted text-muted-foreground",
                    disabled && "opacity-50",
                  )}
                  disabled={disabled}
                  aria-label={
                    light.on
                      ? `Éteindre ${light.name}`
                      : `Allumer ${light.name}`
                  }
                  onClick={() =>
                    lightMutation.mutate({
                      lightId: light.id,
                      body: { on: !light.on },
                    })
                  }
                >
                  {light.on ? (
                    <Lightbulb className="size-4" aria-hidden="true" />
                  ) : (
                    <LightbulbOff className="size-4" aria-hidden="true" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{light.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {light.on
                      ? light.brightness !== null
                        ? `${light.brightness} %`
                        : "Allumée"
                      : "Éteinte"}
                    {!light.reachable ? " · hors ligne" : ""}
                  </p>
                </div>

                <Badge
                  variant={light.on ? "success" : "secondary"}
                  className="shrink-0 text-[10px] sm:text-xs"
                >
                  {light.on ? "ON" : "OFF"}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
