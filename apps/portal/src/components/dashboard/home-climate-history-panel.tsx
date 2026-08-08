import { useState } from "react";
import type { OrionClimateMetric, OrionClimateRange } from "@martylab/shared";
import { useOrionClimateHistoryQuery } from "@/features/orion/use-orion-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkline } from "@/components/dashboard/sparkline";

const METRIC_OPTIONS: Array<{ id: OrionClimateMetric; label: string }> = [
  { id: "indoorTemp", label: "Temp. int." },
  { id: "outdoorTemp", label: "Temp. ext." },
  { id: "indoorHumidity", label: "Humidité" },
  { id: "co2", label: "CO₂" },
];

const RANGE_OPTIONS: Array<{ id: OrionClimateRange; label: string }> = [
  { id: "24h", label: "24 h" },
  { id: "7d", label: "7 j" },
];

export function HomeClimateHistoryPanel({ enabled }: { enabled: boolean }) {
  const [metric, setMetric] = useState<OrionClimateMetric>("indoorTemp");
  const [range, setRange] = useState<OrionClimateRange>("24h");
  const historyQuery = useOrionClimateHistoryQuery({ metric, range }, enabled);

  const history = historyQuery.data;
  const values = history?.points.map((point) => point.value) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Historique climat</CardTitle>
            <CardDescription>
              Données Netatmo via Orion
              {history?.unit ? ` · ${history.unit}` : null}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="xs"
                variant={range === option.id ? "default" : "outline"}
                onClick={() => setRange(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {METRIC_OPTIONS.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="xs"
              variant={metric === option.id ? "secondary" : "ghost"}
              onClick={() => setMetric(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {historyQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">
            Chargement de l&apos;historique…
          </p>
        ) : null}

        {!historyQuery.isLoading && !history?.available ? (
          <Sparkline />
        ) : null}

        {history?.available ? (
          <>
            <Sparkline data={values} />
            <p className="text-xs text-muted-foreground">
              {history.points.length} point(s) sur {range}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
