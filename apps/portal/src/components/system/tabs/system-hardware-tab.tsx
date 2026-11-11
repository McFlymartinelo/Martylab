import { Fan, SlidersHorizontal, Thermometer } from "lucide-react";
import { useSystemHardwareQuery } from "@/features/system/use-system-metrics-query";
import { InlineEmpty, Unavailable } from "@/components/cockpit/feedback";
import { KeyValueList } from "@/components/cockpit/key-value-list";
import { MetricLine } from "@/components/cockpit/metric-line";
import { Panel } from "@/components/cockpit/panel";
import { formatIsoDate, formatRate } from "@/lib/format";

export function SystemHardwareTab() {
  const hardwareQuery = useSystemHardwareQuery();
  const hardware = hardwareQuery.data;

  return (
    <div className="space-y-4">
      <Panel title="Plateforme" icon={SlidersHorizontal} hint="os / /proc / /sys">
        {hardwareQuery.isError ? (
          <InlineEmpty
            title="Informations matérielles indisponibles"
            description="Le backend n'a pas pu lire /proc ou /sys."
          />
        ) : !hardware ? (
          <p className="text-sm text-muted-foreground">
            Chargement des informations matérielles…
          </p>
        ) : (
          <KeyValueList
            items={[
              {
                label: "Processeur",
                value: hardware.facts.cpuModel ?? "Non disponible",
              },
              {
                label: "Cœurs",
                value: String(hardware.cpuCores),
                mono: true,
              },
              {
                label: "Hôte",
                value: hardware.facts.hostname ?? "—",
                mono: true,
              },
              { label: "Système", value: hardware.facts.os ?? "Non disponible" },
              {
                label: "Noyau",
                value: hardware.facts.kernel ?? "—",
                mono: true,
              },
              {
                label: "Architecture",
                value: hardware.facts.architecture ?? "—",
                mono: true,
              },
              {
                label: "Démarrage",
                value: formatIsoDate(hardware.facts.bootTime),
              },
              {
                label: "Governor",
                value: hardware.facts.governor ?? "Non disponible",
                mono: true,
              },
            ]}
          />
        )}
      </Panel>

      <Panel
        title="Capteurs"
        icon={Thermometer}
        hint={hardware ? `${hardware.sensors.length} sonde(s)` : undefined}
      >
        {!hardware ? (
          <p className="text-sm text-muted-foreground">
            Chargement des capteurs…
          </p>
        ) : hardware.sensors.length === 0 ? (
          <InlineEmpty
            title="Aucun capteur exposé"
            description="Aucun fichier temp*_input n'est lisible dans /sys/class/hwmon."
          />
        ) : (
          <div className="space-y-3">
            {hardware.sensors.map((sensor) => (
              <MetricLine
                key={sensor.label}
                label={sensor.label}
                value={`${formatRate(sensor.celsius)} °C`}
                percent={sensor.celsius}
                tone={
                  sensor.celsius >= 80
                    ? "danger"
                    : sensor.celsius >= 65
                      ? "warn"
                      : "accent"
                }
              />
            ))}
            <p className="text-2xs text-muted-foreground">
              Barres calibrées sur 100 °C. Valeurs lues dans /sys/class/hwmon.
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Ventilateurs" icon={Fan}>
        {!hardware ? (
          <p className="text-sm text-muted-foreground">
            Chargement des ventilateurs…
          </p>
        ) : hardware.fans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun ventilateur monitoré par le noyau.
          </p>
        ) : (
          <KeyValueList
            items={hardware.fans.map((fan) => ({
              label: fan.label,
              value: `${formatRate(fan.rpm)} tr/min`,
              mono: true,
            }))}
          />
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Unavailable
          label="Firmware / BIOS / Secure Boot"
          reason="Les tables DMI ne sont pas exposées par le noyau sans outil externe (dmidecode)."
        />
        <Unavailable
          label="Consommation électrique"
          reason="Nécessite un capteur RAPL ou une prise connectée, non exposé par le connecteur serveur."
        />
      </div>
    </div>
  );
}
