import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/features/auth/use-login-mutation";
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

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authQuery = useAuthQuery();
  const loginMutation = useLoginMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Session sécurisée par cookie HttpOnly. Autorisation vérifiée côté
            serveur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              loginMutation.mutate(
                { username, password },
                {
                  onSuccess: () => {
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
                {loginMutation.error instanceof ApiClientError &&
                (loginMutation.error.status === 401 ||
                  isUnauthorized(loginMutation.error))
                  ? "Identifiants invalides."
                  : loginMutation.error instanceof ApiClientError
                    ? loginMutation.error.message
                    : "Connexion impossible."}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Connexion…" : "Se connecter"}
            </Button>
            <Button variant="ghost" className="w-full" render={<Link to="/" />}>
              Retour
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
