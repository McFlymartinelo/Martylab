import { ExternalLink, Film, PlayCircle, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useJellyfinStatusQuery,
  useJellyfinSummaryQuery,
} from "@/features/jellyfin/use-jellyfin-query";
import { JellyfinMediaCard } from "@/components/jellyfin/jellyfin-media-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function JellyfinPanel() {
  const statusQuery = useJellyfinStatusQuery();
  const summaryQuery = useJellyfinSummaryQuery(
    statusQuery.data?.configured === true,
  );

  const configured = statusQuery.data?.configured ?? false;
  const online = statusQuery.data?.online ?? false;
  const summary = summaryQuery.data;

  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement Jellyfin…
        </CardContent>
      </Card>
    );
  }

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jellyfin</CardTitle>
          <CardDescription>
            Connecteur non configuré. Définis <code>JELLYFIN_URL</code> et{" "}
            <code>JELLYFIN_API_KEY</code> dans le backend.
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
            <CardTitle>Jellyfin</CardTitle>
            <Badge variant="outline">Hors ligne</Badge>
          </div>
          <CardDescription>
            Impossible de joindre Jellyfin. Vérifie que le service tourne.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (summaryQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement du résumé Jellyfin…
        </CardContent>
      </Card>
    );
  }

  if (!summary?.available) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Jellyfin</CardTitle>
            <Badge variant="secondary">En ligne</Badge>
          </div>
          <CardDescription>
            Jellyfin répond mais le résumé est indisponible. Vérifie la clé API.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const jellyfinUrl = summary.jellyfinUrl ?? "https://jellyfin.martylab.fr";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Jellyfin</h2>
          <p className="text-xs text-muted-foreground">
            {summary.serverName ?? "Serveur média"}
            {summary.version ? ` · v${summary.version}` : ""}
          </p>
        </div>
        <Badge variant="success">Connecté</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PlayCircle className="size-4" />
              Lecture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-3xl font-semibold tracking-tight">
                {summary.activeSessions}
              </span>{" "}
              session(s) active(s)
            </p>
            <p className="text-muted-foreground">
              {summary.resumeCount} média(s) à reprendre
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Continuer la lecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.resumeItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Rien en cours pour le moment.
              </p>
            ) : (
              summary.resumeItems.map((item) => (
                <JellyfinMediaCard key={item.id} item={item} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Film className="size-4" />
            Ajouts récents
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {summary.latestItems.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Aucun ajout récent détecté.
            </p>
          ) : (
            summary.latestItems.map((item) => (
              <JellyfinMediaCard key={item.id} item={item} />
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" render={<Link to="/jellyfin" />}>
          <Tv className="size-4" />
          Voir la page Jellyfin
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<a href={jellyfinUrl} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink className="size-4" />
          Ouvrir Jellyfin
        </Button>
      </div>
    </section>
  );
}
