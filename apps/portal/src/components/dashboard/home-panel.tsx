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
import { MetricCard } from "@/components/dashboard/metric-card";
import { HomeClimateHistoryPanel } from "@/components/dashboard/home-climate-history-panel";
import { formatHumidity, formatTemperature } from "@/lib/format";

function formatLastSeen(value: string | null): string {
  if (!value) {
    return "Dernière mesure inconnue";
  }

  return `Dernière mesure : ${new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))}`;
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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Maison</h2>
          <p className="text-xs text-muted-foreground">
            {climate.moduleName ?? "Station Netatmo"} ·{" "}
            {formatLastSeen(climate.lastSeen)}
          </p>
        </div>
        <Badge variant="success">Orion connecté</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Température intérieure"
          icon={Thermometer}
          value={formatTemperature(climate.indoor.temperatureCelsius)}
          caption={`Humidité ${formatHumidity(climate.indoor.humidityPercent)}`}
        />
        <MetricCard
          label="Température extérieure"
          icon={Wind}
          value={formatTemperature(climate.outdoor.temperatureCelsius)}
          caption={`Humidité ${formatHumidity(climate.outdoor.humidityPercent)}`}
        />
        <MetricCard
          label="Humidité intérieure"
          icon={Droplets}
          value={formatHumidity(climate.indoor.humidityPercent)}
          caption="Source Orion / Netatmo"
        />
        <MetricCard
          label="CO₂ intérieur"
          icon={Home}
          value={
            climate.co2Ppm !== null ? `${climate.co2Ppm} ppm` : undefined
          }
          caption="Qualité de l'air"
        />
      </div>

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
