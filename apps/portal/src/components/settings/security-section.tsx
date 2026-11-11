import { useState } from "react";
import {
  KeyRound,
  Loader2,
  MonitorSmartphone,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import type { AuthSessionEntry, MfaSetupResponse } from "@martylab/shared";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAuthSessionsQuery,
  useRevokeAuthSessionMutation,
  useRevokeOtherAuthSessionsMutation,
} from "@/features/auth/use-auth-sessions";
import {
  useDisableMfaMutation,
  useEnableMfaMutation,
  useMfaStatusQuery,
  useRegenerateBackupCodesMutation,
  useStartMfaSetupMutation,
} from "@/features/auth/use-mfa";
import { ApiClientError } from "@/lib/api-client";
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

function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "invalid_mfa_code") {
      return "Code invalide ou expiré.";
    }
    if (error.code === "invalid_credentials") {
      return "Mot de passe incorrect.";
    }
    if (error.code === "mfa_already_enabled") {
      return "L'authentification à deux facteurs est déjà active.";
    }
    return error.message;
  }
  return "L'opération a échoué.";
}

function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
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
          {session.current ? <Badge variant="success">session actuelle</Badge> : null}
          {session.mfaVerified ? (
            <Badge variant="info">2FA</Badge>
          ) : null}
        </p>
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

  const mfaQuery = useMfaStatusQuery();
  const startSetupMutation = useStartMfaSetupMutation();
  const enableMutation = useEnableMfaMutation();
  const disableMutation = useDisableMfaMutation();
  const regenerateMutation = useRegenerateBackupCodesMutation();

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenCode, setRegenCode] = useState("");

  const sessions = sessionsQuery.data?.sessions ?? [];
  const mfa = mfaQuery.data;

  function resetSetup() {
    setSetupOpen(false);
    setSetupData(null);
    setPassword("");
    setCode("");
    startSetupMutation.reset();
    enableMutation.reset();
  }

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
            <KeyRound className="size-4 text-muted-foreground" />
            Authentification à deux facteurs
          </CardTitle>
          <CardDescription>
            Un code à usage unique protège la connexion. Obligatoire pour ouvrir
            le terminal de la console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mfaQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : mfaQuery.isError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Impossible de lire l&apos;état du second facteur.
            </p>
          ) : mfa?.enabled ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">activée</Badge>
                {mfa.sessionVerified ? (
                  <Badge variant="info">session vérifiée</Badge>
                ) : (
                  <Badge variant="warn">session non vérifiée</Badge>
                )}
                <span className="text-2xs text-muted-foreground">
                  {mfa.backupCodesRemaining} code
                  {mfa.backupCodesRemaining > 1 ? "s" : ""} de secours
                  disponible{mfa.backupCodesRemaining > 1 ? "s" : ""}
                </span>
              </div>

              {!mfa.sessionVerified ? (
                <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
                  Cette session a été ouverte sans second facteur : le terminal
                  restera bloqué jusqu&apos;à la prochaine connexion.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRegenOpen(true)}
                >
                  Régénérer les codes de secours
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDisableOpen(true)}
                >
                  Désactiver
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0 text-amber-500"
                  aria-hidden="true"
                />
                Sans second facteur, un mot de passe suffit à ouvrir une session
                administrateur sur un portail exposé publiquement.
              </p>
              <Button type="button" size="sm" onClick={() => setSetupOpen(true)}>
                <ShieldCheck className="size-4" aria-hidden="true" />
                Activer
              </Button>
            </>
          )}
        </CardContent>
      </Card>

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
                  {otherSessions(sessions).length} autre
                  {otherSessions(sessions).length > 1 ? "s" : ""} session
                  {otherSessions(sessions).length > 1 ? "s" : ""} active
                  {otherSessions(sessions).length > 1 ? "s" : ""}.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={
                    otherSessions(sessions).length === 0 ||
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
            Les rôles et permissions sont revérifiés à chaque appel. Le terminal
            de la console exige en plus une session vérifiée par second facteur.
          </p>
        </CardContent>
      </Card>

      {/* --- Activation du 2FA : mot de passe, puis QR code, puis confirmation --- */}
      <Dialog
        open={setupOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetSetup();
          }
        }}
      >
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Activer l&apos;authentification à deux facteurs</DialogTitle>
          {setupData ? (
            <div className="space-y-4">
              <DialogDescription>
                Scanne ce QR code avec une application d&apos;authentification,
                puis saisis le code affiché.
              </DialogDescription>
              <div className="flex justify-center">
                <img
                  src={setupData.qrDataUrl}
                  alt="QR code d'enrôlement TOTP"
                  className="size-44 rounded-lg bg-white p-1.5"
                />
              </div>
              <div className="space-y-1">
                <p className="text-2xs text-muted-foreground">
                  Saisie manuelle si le scan est impossible :
                </p>
                <p className="select-all break-all font-mono text-2xs text-foreground">
                  {formatSecret(setupData.secret)}
                </p>
              </div>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  enableMutation.mutate(code, {
                    onSuccess: (result) => {
                      setBackupCodes(result.backupCodes);
                      resetSetup();
                    },
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="enable-code">Code de vérification</Label>
                  <Input
                    id="enable-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className="text-center font-mono tracking-[0.3em]"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    required
                  />
                </div>
                {enableMutation.isError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {mutationErrorMessage(enableMutation.error)}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <DialogClose className="h-8 rounded-lg border border-border px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50">
                    Annuler
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={enableMutation.isPending || code.trim().length < 6}
                  >
                    {enableMutation.isPending ? "Activation…" : "Activer"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                startSetupMutation.mutate(password, {
                  onSuccess: (data) => {
                    setSetupData(data);
                    setPassword("");
                  },
                });
              }}
            >
              <DialogDescription>
                Confirme ton mot de passe pour commencer l&apos;enrôlement.
              </DialogDescription>
              <div className="space-y-2">
                <Label htmlFor="setup-password">Mot de passe</Label>
                <Input
                  id="setup-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              {startSetupMutation.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {mutationErrorMessage(startSetupMutation.error)}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <DialogClose className="h-8 rounded-lg border border-border px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50">
                  Annuler
                </DialogClose>
                <Button type="submit" disabled={startSetupMutation.isPending}>
                  {startSetupMutation.isPending ? "Préparation…" : "Continuer"}
                </Button>
              </div>
            </form>
          )}
        </DialogPopup>
      </Dialog>

      {/* --- Codes de secours : affichés une seule fois --- */}
      <Dialog
        open={backupCodes !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBackupCodes(null);
          }
        }}
      >
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Codes de secours</DialogTitle>
          <DialogDescription>
            Chaque code remplace le code TOTP une seule fois. Conserve-les hors
            ligne : ils ne seront plus affichés.
          </DialogDescription>
          <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {(backupCodes ?? []).map((entry) => (
              <li
                key={entry}
                className="select-all rounded-md border border-border bg-muted/20 px-2 py-1 font-mono text-sm"
              >
                {entry}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => setBackupCodes(null)}>
              Je les ai notés
            </Button>
          </div>
        </DialogPopup>
      </Dialog>

      {/* --- Désactivation --- */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Désactiver le second facteur ?</DialogTitle>
          <DialogDescription>
            Le terminal de la console sera de nouveau inaccessible et la
            connexion ne demandera plus de code.
          </DialogDescription>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              disableMutation.mutate(disablePassword, {
                onSuccess: () => {
                  setDisableOpen(false);
                  setDisablePassword("");
                  toast.show({
                    title: "Second facteur désactivé",
                    type: "success",
                  });
                },
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="disable-password">Mot de passe</Label>
              <Input
                id="disable-password"
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
                required
              />
            </div>
            {disableMutation.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {mutationErrorMessage(disableMutation.error)}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <DialogClose className="h-8 rounded-lg border border-border px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50">
                Annuler
              </DialogClose>
              <Button
                type="submit"
                variant="destructive"
                disabled={disableMutation.isPending}
              >
                Désactiver
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>

      {/* --- Régénération des codes de secours --- */}
      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Régénérer les codes de secours</DialogTitle>
          <DialogDescription>
            Les anciens codes seront invalidés. Confirme avec un code de ton
            application.
          </DialogDescription>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              regenerateMutation.mutate(regenCode, {
                onSuccess: (result) => {
                  setBackupCodes(result.backupCodes);
                  setRegenOpen(false);
                  setRegenCode("");
                },
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="regen-code">Code de vérification</Label>
              <Input
                id="regen-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="text-center font-mono tracking-[0.3em]"
                value={regenCode}
                onChange={(event) => setRegenCode(event.target.value)}
                required
              />
            </div>
            {regenerateMutation.isError ? (
              <p className="text-sm text-destructive" role="alert">
                {mutationErrorMessage(regenerateMutation.error)}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <DialogClose className="h-8 rounded-lg border border-border px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50">
                Annuler
              </DialogClose>
              <Button type="submit" disabled={regenerateMutation.isPending}>
                Régénérer
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>

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

function otherSessions(sessions: AuthSessionEntry[]): AuthSessionEntry[] {
  return sessions.filter((session) => !session.current);
}
