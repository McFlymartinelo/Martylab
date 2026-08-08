import { ExternalLink, MessageSquare, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import type { MatchdayMatch } from "@martylab/shared";
import {
  useMatchdayPageQuery,
  useMatchdayStatusQuery,
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

function formatMessageDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function matchStatusLabel(status: string): string {
  switch (status) {
    case "live":
      return "En cours";
    case "finished":
      return "Terminé";
    case "cancelled":
      return "Annulé";
    default:
      return "À venir";
  }
}

function matchStatusVariant(
  status: string,
): "success" | "secondary" | "outline" | "destructive" {
  if (status === "live") return "destructive";
  if (status === "finished") return "secondary";
  return "outline";
}

function MatchRow({ match }: { match: MatchdayMatch }) {
  const scoreLine =
    match.actualHome !== null && match.actualAway !== null
      ? `${match.actualHome} – ${match.actualAway}`
      : null;

  return (
    <div className="space-y-2 rounded-lg border border-border px-3 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">
            {match.homeTeam} – {match.awayTeam}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatKickoff(match.kickoffAt)} · {match.competitionName}
          </p>
        </div>
        <Badge variant={matchStatusVariant(match.status)}>
          {matchStatusLabel(match.status)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {scoreLine ? (
          <Badge variant="secondary">Score : {scoreLine}</Badge>
        ) : null}
        {match.hasPrediction ? (
          <Badge variant="success">
            Prono {match.predictionHome} – {match.predictionAway}
          </Badge>
        ) : (
          <Badge variant={match.isLocked ? "outline" : "secondary"}>
            {match.isLocked ? "Verrouillé" : "À pronostiquer"}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function MatchdayPage() {
  const statusQuery = useMatchdayStatusQuery();
  const pageQuery = useMatchdayPageQuery(statusQuery.data?.configured === true);

  const configured = statusQuery.data?.configured ?? false;
  const online = statusQuery.data?.online ?? false;
  const page = pageQuery.data;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Matchday</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Matchs du jour, classement et messages du groupe — sans quitter
            Martylab.
          </p>
        </div>

        {page?.matchdayUrl ? (
          <Button
            variant="outline"
            size="sm"
            render={
              <a href={page.matchdayUrl} target="_blank" rel="noreferrer" />
            }
          >
            <ExternalLink className="size-4" />
            Ouvrir Matchday
          </Button>
        ) : null}
      </section>

      {statusQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement Matchday…</p>
      ) : null}

      {!configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Connecteur non configuré</CardTitle>
            <CardDescription>
              Définis <code>MATCHDAY_URL</code> et{" "}
              <code>MATCHDAY_GROUP_ID</code> dans le backend.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {configured && !online ? (
        <Card>
          <CardHeader>
            <CardTitle>Matchday hors ligne</CardTitle>
            <CardDescription>
              Impossible de joindre le service Matchday pour le moment.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {configured && online && pageQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des données…
        </p>
      ) : null}

      {configured && online && page && !page.available ? (
        <Card>
          <CardHeader>
            <CardTitle>Données indisponibles</CardTitle>
            <CardDescription>
              Matchday répond mais la page est inaccessible. Vérifie les
              identifiants service et l&apos;accès au groupe.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {page?.available ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ligue</CardDescription>
                <CardTitle className="text-lg">
                  {page.groupName ?? "Groupe"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ton classement</CardDescription>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="size-4" />
                  {page.userRank !== null ? `${page.userRank}e` : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {page.userTotalPoints ?? 0} points
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Matchs du jour</CardDescription>
                <CardTitle className="text-lg">
                  {page.todayMatches.length}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pronostics</CardDescription>
                <CardTitle className="text-lg">
                  {page.personalized && page.pendingPredictions !== null
                    ? page.pendingPredictions > 0
                      ? `${page.pendingPredictions} en attente`
                      : "À jour"
                    : "Vue groupe"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Matchs du jour
              </h2>
              {page.todayMatches.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    Aucun match prévu aujourd&apos;hui (fuseau Europe/Paris).
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {page.todayMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Prochains matchs
              </h2>
              {page.upcomingMatches.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-sm text-muted-foreground">
                    Aucun match à pronostiquer pour le moment.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {page.upcomingMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Classement
              </h2>
              <Card>
                <CardContent className="py-4">
                  <ul className="space-y-2">
                    {page.standings.map((entry) => (
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
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-medium text-muted-foreground">
                  Informations du groupe
                </h2>
              </div>
              <Card>
                <CardHeader>
                  <CardDescription>
                    Derniers messages du chat Matchday (pas d&apos;API annonces
                    dédiée).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {page.recentMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun message récent.
                    </p>
                  ) : (
                    page.recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className="rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="font-medium">{message.author}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatMessageDate(message.createdAt)}
                          </p>
                        </div>
                        <p className="text-muted-foreground">{message.content}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          <p className="text-xs text-muted-foreground">
            Pour pronostiquer ou discuter, utilise{" "}
            <Link to="/apps" className="underline underline-offset-2">
              l&apos;application Matchday
            </Link>{" "}
            directement.
          </p>
        </>
      ) : null}
    </div>
  );
}
