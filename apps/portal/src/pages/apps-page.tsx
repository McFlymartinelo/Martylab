import { useState } from "react";
import { Search } from "lucide-react";
import { usePluginsQuery } from "@/features/plugins/use-plugins-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppIcon } from "@/components/dashboard/app-icon";

type StatusFilter = "all" | "active" | "inactive";

export function AppsPage() {
  const pluginsQuery = usePluginsQuery();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const plugins = pluginsQuery.data?.plugins ?? [];
  const filtered = plugins.filter((plugin) => {
    const matchesQuery = plugin.name
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesStatus =
      status === "all" ||
      (status === "active" && plugin.enabled) ||
      (status === "inactive" && !plugin.enabled);
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Registre des plugins Martylab. Les applications restent indépendantes
          et sont intégrées uniquement via API.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Rechercher une application…"
            aria-label="Rechercher une application"
            className="pl-8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <Tabs
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="active">Actives</TabsTrigger>
            <TabsTrigger value="inactive">Inactives</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
        filtered.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucun résultat</CardTitle>
              <CardDescription>
                {plugins.length === 0
                  ? "Le registre est vide pour le moment."
                  : "Aucune application ne correspond à ta recherche."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((plugin) => (
              <Card key={plugin.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AppIcon name={plugin.name} />
                      <div>
                        <CardTitle>{plugin.name}</CardTitle>
                        <CardDescription>
                          {plugin.id} · v{plugin.version}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={plugin.enabled ? "success" : "outline"}>
                      {plugin.enabled ? "Actif" : "Inactif"}
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
