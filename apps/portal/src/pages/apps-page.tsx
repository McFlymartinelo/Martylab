import { useState } from "react";
import { Blocks, Search } from "lucide-react";
import { usePluginsQuery } from "@/features/plugins/use-plugins-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineEmpty, Unavailable } from "@/components/cockpit/feedback";
import { PageHeader } from "@/components/cockpit/page-header";
import { Panel } from "@/components/cockpit/panel";
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

  const activeCount = plugins.filter((plugin) => plugin.enabled).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configuration · Registre"
        title="Applications"
        description="Registre des plugins Martylab. Les applications restent indépendantes et sont intégrées uniquement via leur API."
      />

      <Panel
        title="Registre"
        icon={Blocks}
        hint={
          pluginsQuery.data
            ? `${plugins.length} plugin(s) · ${activeCount} actif(s)`
            : undefined
        }
      >
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
            <TabsList aria-label="Filtrer par état">
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="active">Actives</TabsTrigger>
              <TabsTrigger value="inactive">Inactives</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Panel>

      {pluginsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-xl border border-border bg-card"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : null}

      {pluginsQuery.isError ? (
        <Panel title="Registre indisponible" icon={Blocks}>
          <Unavailable
            label="Plugins"
            reason="L'endpoint /api/plugins n'est pas joignable. Aucune donnée mockée n'est affichée."
          />
        </Panel>
      ) : null}

      {pluginsQuery.data && filtered.length === 0 ? (
        <InlineEmpty
          icon={Blocks}
          title={plugins.length === 0 ? "Registre vide" : "Aucun résultat"}
          description={
            plugins.length === 0
              ? "Aucun plugin n'est enregistré pour le moment."
              : "Aucune application ne correspond à ta recherche ou à ce filtre."
          }
        />
      ) : null}

      {filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((plugin) => (
            <Card key={plugin.id} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <AppIcon name={plugin.name} />
                    <div className="min-w-0">
                      <CardTitle className="truncate">{plugin.name}</CardTitle>
                      <p className="truncate font-mono text-2xs text-muted-foreground">
                        {plugin.id} · v{plugin.version}
                      </p>
                    </div>
                  </div>
                  <Badge variant={plugin.enabled ? "success" : "outline"}>
                    {plugin.enabled ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-1.5">
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
      ) : null}
    </div>
  );
}
