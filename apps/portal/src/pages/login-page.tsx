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
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="brand-gradient mb-2 flex size-12 items-center justify-center rounded-2xl text-lg font-semibold text-white">
            M
          </div>
          <CardTitle className="text-xl">Martylab</CardTitle>
          <CardDescription>
            Connecte-toi à ton laboratoire personnel.
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
            <Button variant="ghost" className="w-full" render={<Link to="/" />}>
              Retour
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
