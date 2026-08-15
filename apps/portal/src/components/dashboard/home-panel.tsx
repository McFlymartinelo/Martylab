import type { LucideIcon } from "lucide-react";
import { Droplets, ExternalLink, Home, Thermometer, Wind } from "lucide-react";
import { useOrionClimateQuery, useOrionStatusQuery } from "@/features/orion/use-orion-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeClimateHistoryPanel } from "@/components/dashboard/home-climate-history-panel";
import {
  computeFeelsLikeCelsius,
  formatHumidityCompact,
  formatTemperature,
} from "@/lib/format";
import { cn } from "@/lib/utils";

function formatLastSeen(value: string | null): string {
  if (!value) {
    return "Dernière mesure inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function ClimateZone({
  label,
  icon: Icon,
  temperature,
  detail,
  className,
}: {
  label: string;
  icon: LucideIcon;
  temperature: number | null;
  detail?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/20 px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
          {label}
        </span>
        <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">
        {formatTemperature(temperature)}
      </p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

function resolveOutdoorFeelsLike(
  temperatureCelsius: number | null,
  humidityPercent: number | null,
): number | null {
  if (temperatureCelsius === null) return null;
  if (humidityPercent === null) return temperatureCelsius;
  return computeFeelsLikeCelsius(temperatureCelsius, humidityPercent);
}

export function HomePanel() {
  const statusQuery = useOrionStatusQuery();
  const climateQuery = useOrionClimateQuery(
    statusQuery.data?.configured === true,
  );

  const configured = statusQuery.data?.configured ?? false;
  const online = statusQuery.data?.online ?? false;
  const orionUrl = statusQuery.data?.orionUrl ?? "https://orion.martylab.fr";
  const climate = climateQuery.data;

  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement des données maison…
        </CardContent>
      </Card>
    );
  }

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maison</CardTitle>
          <CardDescription>
            Connecteur Orion non configuré. Définis <code>ORION_URL</code> dans
            le backend Martylab.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!online) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Maison</CardTitle>
            <Badge variant="outline">Orion hors ligne</Badge>
          </div>
          <CardDescription>
            Impossible de joindre Orion. Vérifie que le service tourne et que
            l&apos;URL est correcte.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (climateQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement des capteurs Netatmo…
        </CardContent>
      </Card>
    );
  }

  if (!climate?.available) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Maison</CardTitle>
            <Badge variant="secondary">Orion en ligne</Badge>
          </div>
          <CardDescription>
            Orion répond mais les données Netatmo sont indisponibles pour le
            moment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const outdoorFeelsLike = resolveOutdoorFeelsLike(
    climate.outdoor.temperatureCelsius,
    climate.outdoor.humidityPercent,
  );

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted-foreground">Maison</h2>
          <p className="truncate text-xs text-muted-foreground">
            {climate.moduleName ?? "Station Netatmo"} ·{" "}
            {formatLastSeen(climate.lastSeen)}
          </p>
        </div>
        <Badge variant="success" className="shrink-0">
          Orion connecté
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <ClimateZone
              label="Intérieur"
              icon={Thermometer}
              temperature={climate.indoor.temperatureCelsius}
            />
            <ClimateZone
              label="Extérieur"
              icon={Wind}
              temperature={climate.outdoor.temperatureCelsius}
              detail={
                outdoorFeelsLike !== null
                  ? `Ressenti ${formatTemperature(outdoorFeelsLike)}`
                  : null
              }
            />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Badge variant="outline" className="tabular-nums">
              <Droplets className="mr-1 size-3" aria-hidden="true" />
              Int {formatHumidityCompact(climate.indoor.humidityPercent)} / Ext{" "}
              {formatHumidityCompact(climate.outdoor.humidityPercent)}
            </Badge>
            {climate.co2Ppm !== null ? (
              <Badge variant="outline" className="tabular-nums">
                <Home className="mr-1 size-3" aria-hidden="true" />
                CO₂ {climate.co2Ppm} ppm
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <HomeClimateHistoryPanel enabled={configured && online} />

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          render={<a href={orionUrl} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink className="size-4" />
          Ouvrir Orion
        </Button>
      </div>
    </section>
  );
}
