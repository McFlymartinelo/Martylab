import { Link } from "react-router-dom";
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
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Authentification par session sécurisée. Le backend auth sera branché
            à l&apos;étape suivante — ce formulaire est une fondation UI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="username">Identifiant</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="Alexandre"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                disabled
              />
            </div>
            <Button type="submit" className="w-full" disabled>
              Se connecter (bientôt)
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              render={<Link to="/" />}
            >
              Retour au dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
