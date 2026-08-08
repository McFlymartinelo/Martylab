import type { JellyfinMediaItem } from "@martylab/shared";
import {
  ExternalLink,
  Film,
  Library,
  MonitorPlay,
  PlayCircle,
} from "lucide-react";
import {
  useJellyfinPageQuery,
  useJellyfinStatusQuery,
} from "@/features/jellyfin/use-jellyfin-query";
import {
  formatPlaybackPosition,
  JellyfinMediaCard,
} from "@/components/jellyfin/jellyfin-media-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function MediaGrid({
  items,
  emptyLabel,
}: {
  items: JellyfinMediaItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          {emptyLabel}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <JellyfinMediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function JellyfinPage() {
  const statusQuery = useJellyfinStatusQuery();
  const pageQuery = useJellyfinPageQuery(statusQuery.data?.configured === true);

  const configured = statusQuery.data?.configured ?? false;
  const online = statusQuery.data?.online ?? false;
  const page = pageQuery.data;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Jellyfin</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Bibliothèques, lecture en cours, ajouts récents et activité du
            serveur média.
          </p>
        </div>

        {page?.jellyfinUrl ? (
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={page.jellyfinUrl} target="_blank" rel="noreferrer" />
            }
          >
            <ExternalLink className="size-4" />
            Ouvrir Jellyfin
          </Button>
        ) : null}
      </section>

      {statusQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement Jellyfin…</p>
      ) : null}

      {!configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Connecteur non configuré</CardTitle>
            <CardDescription>
              Définis <code>JELLYFIN_URL</code> et{" "}
              <code>JELLYFIN_API_KEY</code> dans le backend.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {configured && !online ? (
        <Card>
          <CardHeader>
            <CardTitle>Jellyfin hors ligne</CardTitle>
            <CardDescription>
              Impossible de joindre le serveur Jellyfin pour le moment.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {configured && online && pageQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des bibliothèques…
        </p>
      ) : null}

      {configured && online && page && !page.available ? (
        <Card>
          <CardHeader>
            <CardTitle>Données indisponibles</CardTitle>
            <CardDescription>
              Jellyfin répond mais les données sont inaccessibles. Vérifie la
              clé API et l&apos;utilisateur associé.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {page?.available ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Serveur</CardDescription>
                <CardTitle className="text-lg">
                  {page.server?.serverName ?? "Jellyfin"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                v{page.server?.version ?? "—"}
                {page.server?.operatingSystem
                  ? ` · ${page.server.operatingSystem}`
                  : ""}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Bibliothèques</CardDescription>
                <CardTitle className="text-lg">
                  {page.libraries.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>À reprendre</CardDescription>
                <CardTitle className="text-lg">
                  {page.resumeItems.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Lectures actives</CardDescription>
                <CardTitle className="text-lg">
                  {page.sessions.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Library className="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-medium text-muted-foreground">
                Bibliothèques
              </h2>
            </div>
            {page.libraries.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  Aucune bibliothèque visible pour cet utilisateur.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {page.libraries.map((library) => (
                  <Card key={library.id}>
                    <CardContent className="py-4">
                      <p className="font-medium">{library.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {library.type}
                        {library.itemCount !== null
                          ? ` · ${library.itemCount} élément(s)`
                          : ""}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <PlayCircle
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-medium text-muted-foreground">
                  Continuer la lecture
                </h2>
              </div>
              <MediaGrid
                items={page.resumeItems}
                emptyLabel="Aucun média à reprendre."
              />
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Film className="size-4 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-sm font-medium text-muted-foreground">
                  Ajouts récents
                </h2>
              </div>
              <MediaGrid
                items={page.latestItems}
                emptyLabel="Aucun ajout récent."
              />
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">Films</h2>
              <MediaGrid items={page.movies} emptyLabel="Aucun film trouvé." />
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Séries
              </h2>
              <MediaGrid items={page.series} emptyLabel="Aucune série trouvée." />
            </section>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <MonitorPlay
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-sm font-medium text-muted-foreground">
                Informations de lecture
              </h2>
            </div>
            {page.sessions.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  Aucune lecture en cours sur le serveur.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {page.sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {session.itemName ?? "Lecture inconnue"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.userName} · {session.client}
                          {session.itemType ? ` · ${session.itemType}` : ""}
                        </p>
                        {formatPlaybackPosition(
                          session.positionTicks,
                          session.durationTicks,
                        ) ? (
                          <p className="text-xs text-muted-foreground">
                            {formatPlaybackPosition(
                              session.positionTicks,
                              session.durationTicks,
                            )}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={session.isPaused ? "outline" : "success"}>
                        {session.isPaused ? "En pause" : "En lecture"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <p className="text-xs text-muted-foreground">
            Les affiches sont servies via Martylab pour ne pas exposer la clé
            API Jellyfin au navigateur.
          </p>
        </>
      ) : null}
    </div>
  );
}
