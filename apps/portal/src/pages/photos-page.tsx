import type {
  ImmichInstanceStatus,
  ImmichInstanceSummary,
} from "@martylab/shared";
import { ExternalLink, Images } from "lucide-react";
import {
  useImmichPageQuery,
  useImmichStatusQuery,
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

function InstanceStatusBadge({ status }: { status: ImmichInstanceStatus }) {
  if (!status.configured) {
    return <Badge variant="outline">Non configuré</Badge>;
  }

  if (!status.online) {
    return <Badge variant="outline">Hors ligne</Badge>;
  }

  return <Badge variant="success">Connecté</Badge>;
}

function InstanceSection({
  status,
  summary,
}: {
  status: ImmichInstanceStatus | undefined;
  summary: ImmichInstanceSummary | undefined;
}) {
  if (!status) {
    return null;
  }

  if (!status.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{status.label}</CardTitle>
          <CardDescription>
            Instance non configurée. Ajoute les variables{" "}
            <code>
              {status.id === "photos" ? "PHOTOS_" : "PHOTOSSHARED_"}URL
            </code>{" "}
            et{" "}
            <code>
              {status.id === "photos" ? "PHOTOS_" : "PHOTOSSHARED_"}API_KEY
            </code>{" "}
            dans le backend.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!status.online) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{status.label}</CardTitle>
            <InstanceStatusBadge status={status} />
          </div>
          <CardDescription>
            Impossible de joindre Immich pour le moment.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!summary?.available) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{status.label}</CardTitle>
            <InstanceStatusBadge status={status} />
          </div>
          <CardDescription>
            Immich répond mais les données sont inaccessibles. Vérifie la clé
            API.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const immichUrl = summary.immichUrl;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {summary.label}
            </h2>
            <InstanceStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {summary.version ? `v${summary.version}` : "Immich"}
            {summary.stats
              ? ` · ${summary.stats.total} média(s) · ${summary.albumCount} album(s)`
              : ""}
          </p>
        </div>

        {immichUrl ? (
          <Button
            variant="outline"
            size="sm"
            render={<a href={immichUrl} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink className="size-4" />
            Ouvrir Immich
          </Button>
        ) : null}
      </div>

      {summary.stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Photos</CardDescription>
              <CardTitle className="text-lg">{summary.stats.images}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Vidéos</CardDescription>
              <CardTitle className="text-lg">{summary.stats.videos}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Albums partagés</CardDescription>
              <CardTitle className="text-lg">
                {summary.sharedAlbumCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Images className="size-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium text-muted-foreground">Albums</h3>
        </div>

        {summary.albums.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Aucun album disponible pour cette instance.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summary.albums.map((album) => (
              <ImmichAlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export function PhotosPage() {
  const statusQuery = useImmichStatusQuery();
  const pageQuery = useImmichPageQuery(
    statusQuery.data?.anyConfigured === true,
  );

  const statuses = statusQuery.data?.instances ?? [];
  const summaries = pageQuery.data?.instances ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Photos</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Bibliothèques Immich personnelles et partagées. Ouvre Immich pour
          gérer les albums et les liens de partage publics.
        </p>
      </section>

      {statusQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement Immich…</p>
      ) : null}

      {!statusQuery.isLoading && !statusQuery.data?.anyConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle>Connecteur non configuré</CardTitle>
            <CardDescription>
              Définis au moins une paire{" "}
              <code>PHOTOS_URL</code> / <code>PHOTOS_API_KEY</code> ou{" "}
              <code>PHOTOSSHARED_URL</code> / <code>PHOTOSSHARED_API_KEY</code>{" "}
              dans le backend.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {statusQuery.data?.anyConfigured && pageQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des bibliothèques…
        </p>
      ) : null}

      {statuses.map((status) => (
        <InstanceSection
          key={status.id}
          status={status}
          summary={summaries.find((summary) => summary.id === status.id)}
        />
      ))}

      <p className="text-xs text-muted-foreground">
        Les miniatures sont servies via MartyLab pour ne pas exposer les clés
        API Immich au navigateur.
      </p>
    </div>
  );
}
