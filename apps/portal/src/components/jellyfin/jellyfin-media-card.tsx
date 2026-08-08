import type { JellyfinMediaItem } from "@martylab/shared";
import { Film } from "lucide-react";

function formatTicks(ticks: number | null): string | null {
  if (ticks === null || ticks <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(ticks / 10_000_000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function JellyfinMediaCard({ item }: { item: JellyfinMediaItem }) {
  const subtitle = [
    item.seriesName,
    item.seasonEpisode,
    item.year ? String(item.year) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex gap-3 rounded-lg border border-border p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Film className="size-5" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium">{item.name}</p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
        {item.playedPercent !== null ? (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, item.playedPercent)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(item.playedPercent)} % vu
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function formatPlaybackPosition(
  positionTicks: number | null,
  durationTicks: number | null,
): string | null {
  const position = formatTicks(positionTicks);
  const duration = formatTicks(durationTicks);

  if (!position || !duration) {
    return position;
  }

  return `${position} / ${duration}`;
}
