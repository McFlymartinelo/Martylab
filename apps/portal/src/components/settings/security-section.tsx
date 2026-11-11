import { useState } from "react";
import {
  Loader2,
  MonitorSmartphone,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { AuthSessionEntry } from "@martylab/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAuthSessionsQuery,
  useRevokeAuthSessionMutation,
  useRevokeOtherAuthSessionsMutation,
} from "@/features/auth/use-auth-sessions";
import { formatIsoDate } from "@/lib/format";
import { useToast } from "@/lib/use-toast";

function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return "Appareil inconnu";
  }

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Navigateur";

  const os = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iPod/.test(userAgent)
        ? "iOS"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "système inconnu";

  return `${browser} · ${os}`;
}

function SessionRow({
  session,
  onRevoke,
  revoking,
}: {
  session: AuthSessionEntry;
  onRevoke: (session: AuthSessionEntry) => void;
  revoking: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-muted/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <MonitorSmartphone
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          {describeUserAgent(session.userAgent)}
          {session.current ? <Badge variant="success">session actuelle</Badge> : null}        </p>
        <p className="mt-1 font-mono text-2xs text-muted-foreground">
          {session.ipAddress ?? "IP inconnue"} · ouverte le{" "}
          {formatIsoDate(session.createdAt)} · expire le{" "}
          {formatIsoDate(session.expiresAt)}
        </p>
      </div>
      {session.current ? (
        <Badge variant="success">session actuelle</Badge>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={revoking}
          onClick={() => onRevoke(session)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Révoquer
        </Button>
      )}
    </li>
  );
}

export function SecuritySection() {
  const sessionsQuery = useAuthSessionsQuery();
  const revokeMutation = useRevokeAuthSessionMutation();
  const revokeOthersMutation = useRevokeOtherAuthSessionsMutation();
  const toast = useToast();
  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);

  const sessions = sessionsQuery.data?.sessions ?? [];
  const otherSessions = sessions.filter((session) => !session.current);

  function revoke(session: AuthSessionEntry) {
    revokeMutation.mutate(session.id, {
      onSuccess: () => {
        toast.show({
          title: "Session révoquée",
          description: describeUserAgent(session.userAgent),
          type: "success",
        });
      },
      onError: () => {
        toast.show({
          title: "Révocation impossible",
          description: "Le serveur a refusé la demande.",
          type: "error",
        });
      },
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Chaque session correspond à un appareil connecté. Révoque celles que
            tu ne reconnais pas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement des sessions…
            </p>
          ) : sessionsQuery.isError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Impossible de lire les sessions. La base de données est peut-être
              indisponible.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onRevoke={revoke}
                    revoking={revokeMutation.isPending}
                  />
                ))}
              </ul>

              <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-2xs text-muted-foreground">
                  {otherSessions.length} autre
                  {otherSessions.length > 1 ? "s" : ""} session
                  {otherSessions.length > 1 ? "s" : ""} active
                  {otherSessions.length > 1 ? "s" : ""}.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={
                    otherSessions.length === 0 ||
                    revokeOthersMutation.isPending
                  }
                  onClick={() => setConfirmRevokeOthers(true)}
                >
                  {revokeOthersMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  )}
                  Révoquer les autres
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modèle de sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p>Cookies de session httpOnly, SameSite et expiration serveur.</p>
          <p>
            Toute requête mutante exige un en-tête <code>Origin</code> conforme
            au portail.
          </p>
          <p>
            Les rôles et permissions sont revérifiés à chaque appel, y compris
            pour la console et son terminal conteneur.
          </p>
        </CardContent>
      </Card>

      <Dialog
        open={confirmRevokeOthers}
        onOpenChange={setConfirmRevokeOthers}
      >
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Révoquer les autres sessions ?</DialogTitle>
          <DialogDescription>
            Tous les autres appareils devront se reconnecter. La session
            actuelle reste ouverte.
          </DialogDescription>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <DialogClose className="h-8 rounded-lg border border-border px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50">
              Annuler
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={revokeOthersMutation.isPending}
              onClick={() => {
                revokeOthersMutation.mutate(undefined, {
                  onSuccess: () => {
                    setConfirmRevokeOthers(false);
                    toast.show({
                      title: "Sessions révoquées",
                      description: "Les autres appareils ont été déconnectés.",
                      type: "success",
                    });
                  },
                  onError: () => {
                    toast.show({
                      title: "Révocation impossible",
                      type: "error",
                    });
                  },
                });
              }}
            >
              Confirmer
            </Button>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
