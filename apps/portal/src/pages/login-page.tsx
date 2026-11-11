import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useLoginMutation } from "@/features/auth/use-login-mutation";
import { useVerifyMfaMutation } from "@/features/auth/use-mfa";
import {
  isUnauthorized,
  useAuthQuery,
} from "@/features/auth/use-auth-query";
import { ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401 || isUnauthorized(error)) {
      return "Identifiants invalides.";
    }
    if (error.code === "database_unavailable") {
      return "Base de données indisponible. Réessaie dans un instant.";
    }
    return error.message;
  }
  return "Connexion impossible. Vérifie que le backend est démarré.";
}

function mfaErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "mfa_challenge_invalid") {
      return "Défi expiré. Recommence la connexion.";
    }
    if (error.code === "invalid_mfa_code") {
      return "Code invalide ou déjà utilisé.";
    }
    if (error.status === 429) {
      return "Trop de tentatives. Réessaie dans quelques minutes.";
    }
    return error.message;
  }
  return "Vérification impossible.";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authQuery = useAuthQuery();
  const loginMutation = useLoginMutation();
  const verifyMfaMutation = useVerifyMfaMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const from =
    typeof location.state === "object" &&
    location.state &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/";

  if (authQuery.isSuccess && authQuery.data?.user) {
    return <Navigate to={from} replace />;
  }

  const mfaStep = challengeToken !== null;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="brand-mark mb-2 flex size-12 items-center justify-center rounded-2xl text-lg font-semibold">
            {mfaStep ? (
              <ShieldCheck className="size-5" aria-hidden="true" />
            ) : (
              "M"
            )}
          </div>
          <CardTitle className="text-xl">
            {mfaStep ? "Vérification" : "Martylab"}
          </CardTitle>
          <CardDescription>
            {mfaStep
              ? "Saisis le code à 6 chiffres de ton application d'authentification."
              : "Connecte-toi à ton laboratoire personnel."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaStep ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                verifyMfaMutation.mutate(
                  { challengeToken, code },
                  {
                    onSuccess: () => {
                      void navigate(from, { replace: true });
                    },
                  },
                );
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Code de vérification</Label>
                <Input
                  id="mfa-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  placeholder="123456"
                  className="text-center font-mono text-lg tracking-[0.3em]"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  maxLength={24}
                  required
                />
              </div>

              {verifyMfaMutation.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {mfaErrorMessage(verifyMfaMutation.error)}
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={verifyMfaMutation.isPending || code.trim().length < 6}
              >
                {verifyMfaMutation.isPending ? "Vérification…" : "Valider"}
              </Button>

              <p className="text-center text-2xs text-muted-foreground">
                Tu peux aussi saisir l&apos;un de tes codes de secours.
              </p>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setChallengeToken(null);
                  setCode("");
                  verifyMfaMutation.reset();
                }}
              >
                Recommencer
              </Button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate(
                  { username, password },
                  {
                    onSuccess: (data) => {
                      if (data.status === "mfa_required") {
                        setChallengeToken(data.challengeToken);
                        setPassword("");
                        return;
                      }
                      void navigate(from, { replace: true });
                    },
                  },
                );
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="username">Identifiant</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="alexandre"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {loginMutation.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {loginErrorMessage(loginMutation.error)}
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Connexion…" : "Se connecter"}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-2xs text-muted-foreground">
                <KeyRound className="size-3" aria-hidden="true" />
                Authentification à deux facteurs disponible dans Paramètres →
                Sécurité.
              </p>

              <Button
                variant="ghost"
                className="w-full"
                render={<Link to="/" />}
              >
                Retour
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
