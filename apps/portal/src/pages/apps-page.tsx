import { usePluginsQuery } from "@/features/plugins/use-plugins-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AppsPage() {
  const pluginsQuery = usePluginsQuery();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Applications</h1>
        <p className="max-w-2xl text-muted-foreground">
          Registre des plugins Martylab. Les applications restent indépendantes
          et sont intégrées uniquement via API.
        </p>
      </section>

      {pluginsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement des plugins…</p>
      ) : null}

      {pluginsQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Registre indisponible</CardTitle>
            <CardDescription>
              L&apos;endpoint <code>/api/plugins</code> n&apos;est pas encore
              disponible. Aucune donnée mockée n&apos;est affichée.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {pluginsQuery.data ? (
        pluginsQuery.data.plugins.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucun plugin enregistré</CardTitle>
              <CardDescription>
                Le registre est vide pour le moment.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pluginsQuery.data.plugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{plugin.name}</CardTitle>
                      <CardDescription>
                        {plugin.id} · v{plugin.version}
                      </CardDescription>
                    </div>
                    <Badge variant={plugin.enabled ? "default" : "outline"}>
                      {plugin.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2">
                    {plugin.capabilities.map((capability) => (
                      <li key={capability}>
                        <Badge variant="secondary">{capability}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
