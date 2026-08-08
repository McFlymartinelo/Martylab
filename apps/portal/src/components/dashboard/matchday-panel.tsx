import { ExternalLink, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useMatchdayStatusQuery,
  useMatchdaySummaryQuery,
} from "@/features/matchday/use-matchday-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatKickoff(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function MatchdayPanel() {
  const statusQuery = useMatchdayStatusQuery();
  const summaryQuery = useMatchdaySummaryQuery(
    statusQuery.data?.configured === true,
  );

  const configured = statusQuery.data?.configured ?? false;
  const online = statusQuery.data?.online ?? false;
  const summary = summaryQuery.data;

  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement Matchday…
        </CardContent>
      </Card>
    );
  }

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matchday</CardTitle>
          <CardDescription>
            Connecteur non configuré. Définis <code>MATCHDAY_URL</code> et{" "}
            <code>MATCHDAY_GROUP_ID</code> dans le backend.
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
            <CardTitle>Matchday</CardTitle>
            <Badge variant="outline">Hors ligne</Badge>
          </div>
          <CardDescription>
            Impossible de joindre Matchday. Vérifie que le service tourne.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (summaryQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Chargement du résumé Matchday…
        </CardContent>
      </Card>
    );
  }

  if (!summary?.available) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Matchday</CardTitle>
            <Badge variant="secondary">En ligne</Badge>
          </div>
          <CardDescription>
            Matchday répond mais le résumé est indisponible. Vérifie les
            identifiants service et l&apos;accès au groupe.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const matchdayUrl = summary.matchdayUrl ?? "https://matchday.martylab.fr";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Matchday
          </h2>
          <p className="text-xs text-muted-foreground">
            {summary.groupName ?? "Ligue"} ·{" "}
            {summary.memberCount ?? "—"} joueurs
          </p>
        </div>
        <Badge variant="success">Connecté</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4" />
              Ton classement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.userRank !== null ? (
              <>
                <p className="text-3xl font-semibold tracking-tight">
                  {summary.userRank}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {summary.memberCount}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {summary.userTotalPoints ?? 0} points
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Classement introuvable pour ton compte (vérifie le pseudo
                Matchday ou <code>MATCHDAY_USER_PASSWORDS</code>).
              </p>
            )}
            {summary.personalized && summary.pendingPredictions !== null ? (
              <Badge variant={summary.pendingPredictions > 0 ? "secondary" : "success"}>
                {summary.pendingPredictions > 0
                  ? `${summary.pendingPredictions} prono(s) en attente`
                  : "Pronostics à jour"}
              </Badge>
            ) : (
              <Badge variant="outline">Lecture groupe (compte non lié)</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Top 5</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.topStandings.map((entry) => (
                <li
                  key={`${entry.rank}-${entry.displayName}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">
                    {entry.rank}. {entry.displayName}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {entry.totalPoints} pts
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Prochains matchs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.upcomingMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun match à pronostiquer pour le moment.
              </p>
            ) : (
              summary.upcomingMatches.map((match) => (
                <div key={match.id} className="space-y-1 text-sm">
                  <p className="font-medium">
                    {match.homeTeam} – {match.awayTeam}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatKickoff(match.kickoffAt)} · {match.competitionName}
                  </p>
                  <Badge variant={match.hasPrediction ? "success" : "outline"}>
                    {match.hasPrediction ? "Pronostic fait" : "À pronostiquer"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" render={<Link to="/matchday" />}>
          Voir la page Matchday
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<a href={matchdayUrl} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink className="size-4" />
          Ouvrir Matchday
        </Button>
      </div>
    </section>
  );
}
