import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  LogOut,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { UserRole } from "@martylab/shared";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { useLogoutMutation } from "@/features/auth/use-logout-mutation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyValueList } from "@/components/cockpit/key-value-list";
import { formatIsoDate } from "@/lib/format";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrateur",
  user: "Utilisateur",
  guest: "Invité",
};

const roleDescriptions: Record<UserRole, string> = {
  admin:
    "Accès complet : gestion des utilisateurs, console, terminal conteneur et tous les plugins.",
  user: "Peut piloter les conteneurs et utiliser toutes les applications, sans accès administration.",
  guest: "Consultation seule : les états, logs et contenus restent visibles, aucune action.",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileSection() {
  const authQuery = useAuthQuery();
  const logoutMutation = useLogoutMutation();
  const user = authQuery.data?.user;

  if (!user) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          {authQuery.isLoading
            ? "Chargement du profil…"
            : "Profil indisponible : la session n'a pas pu être lue."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            Identité
          </CardTitle>
          <CardDescription>
            Compte utilisé pour toutes les actions du portail et de la console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar size="lg" className="size-12">
              <AvatarFallback className="text-base">
                {initials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold">
                {user.displayName}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                @{user.username}
              </p>
            </div>
            <Badge
              variant={user.role === "admin" ? "success" : "secondary"}
              className="ml-auto"
            >
              <ShieldCheck className="size-3" aria-hidden="true" />
              {roleLabels[user.role]}
            </Badge>
          </div>

          <KeyValueList
            items={[
              { label: "Identifiant", value: user.username, mono: true },
              { label: "Rôle", value: roleLabels[user.role] },
              {
                label: "Membre depuis",
                value: formatIsoDate(user.createdAt),
              },
              {
                label: "Source d'authentification",
                value: "Session Martylab (cookie httpOnly)",
              },
            ]}
          />

          <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-2xs text-muted-foreground">
            {roleDescriptions[user.role]}
          </p>

          <div className="flex flex-wrap gap-2">
            {user.role === "admin" ? (
              <Button variant="outline" render={<Link to="/users" />}>
                <Users className="size-4" aria-hidden="true" />
                Gérer les utilisateurs
              </Button>
            ) : null}
            <Button
              variant="destructive"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-muted-foreground" />
            Bonnes pratiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Les sessions expirent automatiquement après la durée configurée
            (7 jours par défaut) et peuvent être révoquées depuis l&apos;onglet
            Sécurité.
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            Les permissions sont toujours vérifiées par le backend : modifier
            l&apos;interface ne donne aucun droit supplémentaire.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
