import { ClipboardCopy, Database, HeartPulse, Info, Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  systemOverviewQueryKey,
  useSystemOverviewQuery,
} from "@/features/system/use-system-metrics-query";
import { formatIsoDate } from "@/lib/format";
import { useToast } from "@/lib/use-toast";

export function AboutSection() {
  const healthQuery = useHealthQuery();
  const pluginsQuery = usePluginsQuery();
  const overviewQuery = useSystemOverviewQuery();
  const queryClient = useQueryClient();
  const toast = useToast();

  const health = healthQuery.data;
  const overview = overviewQuery.data;
  const facts = overview?.facts;
  const plugins = Array.isArray(pluginsQuery.data?.plugins)
    ? pluginsQuery.data.plugins
    : [];

  const databaseLabel =
    health?.database === "up"
      ? "Connectée"
      : health?.database === "down"
        ? "Injoignable"
        : healthQuery.isError
          ? "Indisponible"
          : "Non configurée";

  function copyDiagnostics() {
    const lines = [
      `Martylab ${__APP_VERSION__}`,
      `Statut : ${health?.status ?? "inconnu"}`,
      `Base de données : ${databaseLabel}`,
      `Hôte : ${facts?.hostname ?? "—"}`,
      `Système : ${facts?.os ?? "—"}`,
      `Noyau : ${facts?.kernel ?? "—"}`,
      `Architecture : ${facts?.architecture ?? "—"}`,
      `Plugins : ${plugins.length}`,
      `Mesuré le : ${health?.timestamp ?? new Date().toISOString()}`,
      `Navigateur : ${navigator.userAgent}`,
    ];

    const clipboard = navigator.clipboard;
    if (!clipboard?.writeText) {
      toast.show({
        title: "Copie indisponible",
        description: "Le navigateur ne permet pas l'accès au presse-papiers sur cette page.",
        type: "error",
      });
      return;
    }

    void clipboard
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

  function refreshDiagnostics() {
    void queryClient.invalidateQueries({ queryKey: ["health"] });
    void queryClient.invalidateQueries({ queryKey: ["plugins"] });
    void queryClient.invalidateQueries({ queryKey: systemOverviewQueryKey });
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
                value: facts?.hostname ?? "Non disponible",
                mono: true,
              },
              {
                label: "Système",
                value: facts?.os ?? "Non disponible",
              },
              {
                label: "Noyau",
                value: facts?.kernel ?? "Non disponible",
                mono: true,
              },
              {
                label: "Architecture",
                value: facts?.architecture ?? "Non disponible",
                mono: true,
              },
              {
                label: "Source des métriques",
                value:
                  overview?.source === "host"
                    ? "serveur hôte"
                    : overview?.source === "container"
                      ? "conteneur backend"
                      : "Non disponible",
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
              : pluginsQuery.isError
                ? "Registre des plugins indisponible."
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
          <CardContent className="space-y-3">
            {healthQuery.isError || overviewQuery.isError ? (
              <p className="text-sm text-muted-foreground">
                {healthQuery.isError && overviewQuery.isError
                  ? "La santé du backend et les informations système n'ont pas pu être chargées."
                  : healthQuery.isError
                    ? "La santé du backend n'a pas pu être chargée."
                    : "Les informations système n'ont pas pu être chargées."}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={refreshDiagnostics}>
                Réessayer
              </Button>
              <Button variant="outline" size="sm" onClick={copyDiagnostics}>
                <ClipboardCopy className="size-3.5" aria-hidden="true" />
                Copier le rapport
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
