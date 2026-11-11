import { Link } from "react-router-dom";
import { House, Trophy, Tv } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useJellyfinSummaryQuery } from "@/features/jellyfin/use-jellyfin-query";
import {
  useMatchdayStatusQuery,
  useMatchdaySummaryQuery,
} from "@/features/matchday/use-matchday-query";
import {
  useOrionClimateQuery,
  useOrionLightsQuery,
  useOrionStatusQuery,
} from "@/features/orion/use-orion-query";
import { InlineEmpty } from "@/components/cockpit/feedback";
import { formatHumidityCompact, formatTemperature } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TodayEntry {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  value: string;
  to?: string;
}

function formatKickoff(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function TodayRow({ entry }: { entry: TodayEntry }) {
  const content = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <entry.icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{entry.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {entry.subtitle}
        </span>
      </span>
      <span className="shrink-0 font-mono text-2xs tabular-nums text-muted-foreground">
        {entry.value}
      </span>
    </>
  );

  const className =
    "flex items-center gap-3 rounded-lg px-1 py-2 transition-colors";

  if (!entry.to) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link
      to={entry.to}
      className={cn(
        className,
        "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      {content}
    </Link>
  );
}

/**
 * Résumé « Aujourd'hui » construit uniquement sur des données réelles
 * (Orion, Matchday, Jellyfin). Chaque ligne n'apparaît que si le connecteur
 * correspondant répond ; sinon le panneau affiche un état vide explicite.
 */
export function TodayPanel({ className }: { className?: string }) {
  const orionStatus = useOrionStatusQuery();
  const orionOnline = orionStatus.data?.online === true;
  const climate = useOrionClimateQuery(orionOnline);
  const lights = useOrionLightsQuery(orionOnline);

  const matchdayStatus = useMatchdayStatusQuery();
  const matchdayReady = matchdayStatus.data?.online === true;
  const matchday = useMatchdaySummaryQuery(matchdayReady);
  const jellyfin = useJellyfinSummaryQuery();

  const entries: TodayEntry[] = [];

  const climateData = climate.data;
  if (climateData?.available) {
    const lightsData = lights.data;
    const lightsOn = lightsData?.available
      ? lightsData.lights.filter((light) => light.on).length
      : null;
    const lightsTotal = lightsData?.available ? lightsData.lights.length : null;

    entries.push({
      id: "orion",
      icon: House,
      title: "Maison",
      subtitle: `${formatTemperature(climateData.indoor.temperatureCelsius)} · ${formatHumidityCompact(climateData.indoor.humidityPercent)}`,
      value:
        lightsOn !== null && lightsTotal !== null
          ? `${lightsOn}/${lightsTotal} allumées`
          : "Climat",
    });
  }

  const nextMatch = matchday.data?.upcomingMatches[0];
  if (nextMatch) {
    entries.push({
      id: "matchday",
      icon: Trophy,
      title: `${nextMatch.homeTeam} – ${nextMatch.awayTeam}`,
      subtitle: `${nextMatch.competitionName} · ${formatKickoff(nextMatch.kickoffAt)}`,
      value: nextMatch.hasPrediction ? "Prono fait" : "À pronostiquer",
      to: "/matchday",
    });
  }

  const resume = jellyfin.data?.resumeItems[0];
  if (resume) {
    entries.push({
      id: "jellyfin",
      icon: Tv,
      title: resume.name,
      subtitle:
        [resume.seriesName, resume.seasonEpisode].filter(Boolean).join(" · ") ||
        "Jellyfin",
      value:
        resume.playedPercent !== null
          ? `${Math.round(resume.playedPercent)} %`
          : "Reprendre",
      to: "/jellyfin",
    });
  }

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4 text-card-foreground",
        className,
      )}
      aria-labelledby="today-title"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id="today-title" className="font-heading text-sm font-semibold">
          Aujourd&apos;hui
        </h2>
        <span className="font-mono text-2xs text-muted-foreground">
          {new Intl.DateTimeFormat("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(new Date())}
        </span>
      </div>

      {entries.length > 0 ? (
        <div className="divide-y divide-border/60">
          {entries.map((entry) => (
            <TodayRow key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <InlineEmpty
          title="Rien à résumer pour l'instant"
          description="Orion, Matchday et Jellyfin n'ont rien remonté. Configure les connecteurs dans Applications pour alimenter ce panneau."
          className="py-6"
        />
      )}
    </section>
  );
}
