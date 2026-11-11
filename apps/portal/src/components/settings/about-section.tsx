import { ClipboardCopy, Database, HeartPulse, Info, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyValueList } from "@/components/cockpit/key-value-list";
import { useHealthQuery } from "@/features/health/use-health-query";
import { usePluginsQuery } from "@/features/plugins/use-plugins-query";
import { useSystemOverviewQuery } from "@/features/system/use-system-metrics-query";
import { formatIsoDate } from "@/lib/format";
import { useToast } from "@/lib/use-toast";

export function AboutSection() {
  const healthQuery = useHealthQuery();
  const pluginsQuery = usePluginsQuery();
  const overviewQuery = useSystemOverviewQuery();
  const toast = useToast();

  const health = healthQuery.data;
  const overview = overviewQuery.data;
  const plugins = pluginsQuery.data?.plugins ?? [];

  const databaseLabel =
    health?.database === "up"
      ? "Connectée"
      : health?.database === "down"
        ? "Injoignable"
        : "Non configurée";

  function copyDiagnostics() {
    const lines = [
      `Martylab ${__APP_VERSION__}`,
      `Statut : ${health?.status ?? "inconnu"}`,
      `Base de données : ${databaseLabel}`,
      `Hôte : ${overview?.facts.hostname ?? "—"}`,
      `Système : ${overview?.facts.os ?? "—"}`,
      `Noyau : ${overview?.facts.kernel ?? "—"}`,
      `Architecture : ${overview?.facts.architecture ?? "—"}`,
      `Plugins : ${plugins.length}`,
      `Mesuré le : ${health?.timestamp ?? new Date().toISOString()}`,
      `Navigateur : ${navigator.userAgent}`,
    ];

    void navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => {
        toast.show({
          title: "Diagnostics copiés",
          description: "Le rapport est dans le presse-papiers.",
          type: "success",
        });
      })
      .catch(() => {
        toast.show({
          title: "Copie impossible",
          description: "Le navigateur a refusé l'accès au presse-papiers.",
          type: "error",
        });
      });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" />
            Martylab
          </CardTitle>
          <CardDescription>
            Hub d&apos;applications personnel, self-hosted. Chaque application
            reste indépendante et communique par API via les plugins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              {
                label: "Version du portail",
                value: __APP_VERSION__,
                mono: true,
              },
              {
                label: "Backend",
                value: health?.service ?? "martylab-backend",
                mono: true,
              },
              {
                label: "Statut de santé",
                value: (
                  <Badge
                    variant={
                      health?.status === "ok" ? "success" : "warn"
                    }
                  >
                    {health?.status ?? "inconnu"}
                  </Badge>
                ),
              },
              {
                label: "Base de données",
                value: (
                  <Badge
                    variant={
                      health?.database === "up" ? "success" : "outline"
                    }
                  >
                    {databaseLabel}
                  </Badge>
                ),
              },
              {
                label: "Dernière mesure",
                value: formatIsoDate(health?.timestamp),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" />
            Hôte et pile technique
          </CardTitle>
          <CardDescription>
            Lecture seule depuis <code>/proc</code> et <code>os-release</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeyValueList
            items={[
              {
                label: "Hôte",
                value: overview?.facts.hostname ?? "Non disponible",
                mono: true,
              },
              {
                label: "Système",
                value: overview?.facts.os ?? "Non disponible",
              },
              {
                label: "Noyau",
                value: overview?.facts.kernel ?? "Non disponible",
                mono: true,
              },
              {
                label: "Architecture",
                value: overview?.facts.architecture ?? "Non disponible",
                mono: true,
              },
              {
                label: "Source des métriques",
                value:
                  overview?.source === "host"
                    ? "serveur hôte"
                    : "conteneur backend",
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              Plugins
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {pluginsQuery.isLoading
              ? "Chargement…"
              : `${plugins.length} plugin(s) enregistré(s), dont ${plugins.filter((plugin) => plugin.enabled).length} activé(s).`}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-4 text-muted-foreground" />
              Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={copyDiagnostics}>
              <ClipboardCopy className="size-3.5" aria-hidden="true" />
              Copier le rapport
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
