import type { ImmichAlbumSummary } from "@martylab/shared";
import { Images } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export function ImmichAlbumCard({ album }: { album: ImmichAlbumSummary }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[4/3] bg-muted">
        {album.thumbnailUrl ? (
          <img
            src={album.thumbnailUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Images className="size-8" aria-hidden="true" />
          </div>
        )}
      </div>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 font-medium">{album.name}</p>
          {album.shared ? <Badge variant="outline">Partagé</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {album.assetCount} élément{album.assetCount > 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
