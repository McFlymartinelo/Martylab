import { ExternalLink, Images } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useImmichStatusQuery,
  useImmichSummaryQuery,
} from "@/features/immich/use-immich-query";
import { ImmichAlbumCard } from "@/components/immich/immich-album-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ImmichPanel() {
  const statusQuery = useImmichStatusQuery();
  const summaryQuery = useImmichSummaryQuery(
    statusQuery.data?.anyConfigured === true,
  );

  const configured = statusQuery.data?.anyConfigured ?? false;
  const online = statusQuery.data?.anyOnline ?? false;
  const summaries =
    summaryQuery.data?.instances.filter((instance) => instance.available) ?? [];

  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement Immich…
        </CardContent>
      </Card>
    );
  }

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
          <CardDescription>
            Connecteur non configuré. Définis <code>PHOTOS_URL</code> et{" "}
            <code>PHOTOS_API_KEY</code> (ou <code>PHOTOSSHARED_*</code>) dans le
            backend.
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
            <CardTitle>Photos</CardTitle>
            <Badge variant="outline">Hors ligne</Badge>
          </div>
          <CardDescription>
            Impossible de joindre Immich pour le moment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (summaryQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement du résumé Immich…
        </CardContent>
      </Card>
    );
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Photos</CardTitle>
            <Badge variant="secondary">En ligne</Badge>
          </div>
          <CardDescription>
            Immich répond mais le résumé est indisponible. Vérifie les clés API.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalMedia = summaries.reduce(
    (sum, instance) => sum + (instance.stats?.total ?? 0),
    0,
  );
  const totalAlbums = summaries.reduce(
    (sum, instance) => sum + instance.albumCount,
    0,
  );
  const previewAlbums = summaries.flatMap((instance) => instance.albums).slice(0, 4);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">Photos</h2>
          <p className="text-xs text-muted-foreground">
            {summaries.length} instance(s) Immich · {totalMedia} média(s) ·{" "}
            {totalAlbums} album(s)
          </p>
        </div>
        <Badge variant="success">Connecté</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {summaries.map((instance) => (
          <Card key={instance.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Images className="size-4" />
                {instance.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-2xl font-semibold tracking-tight">
                  {instance.stats?.images ?? 0}
                </span>{" "}
                photo(s)
              </p>
              <p className="text-muted-foreground">
                {instance.stats?.videos ?? 0} vidéo(s) · {instance.albumCount}{" "}
                album(s)
              </p>
              {instance.immichUrl ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={instance.immichUrl}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <ExternalLink className="size-4" />
                  Ouvrir
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {previewAlbums.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Albums récents</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {previewAlbums.map((album) => (
              <ImmichAlbumCard key={album.id} album={album} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end">
        <Button variant="outline" size="sm" render={<Link to="/photos" />}>
          <Images className="size-4" />
          Voir la page Photos
        </Button>
      </div>
    </section>
  );
}
