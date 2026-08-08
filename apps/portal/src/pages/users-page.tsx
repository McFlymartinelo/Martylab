import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import type { User, UserRole } from "@martylab/shared";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/features/users/use-users-query";
import { ApiClientError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
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

const roleLabels: Record<UserRole, string> = {
  admin: "Administrateur",
  user: "Utilisateur",
  guest: "Invité",
};

function roleBadgeVariant(role: UserRole): "default" | "secondary" | "outline" {
  if (role === "admin") return "default";
  if (role === "user") return "secondary";
  return "outline";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case "username_taken":
        return "Ce nom d'utilisateur est déjà pris.";
      case "last_admin":
        return "Impossible de supprimer le dernier administrateur.";
      case "cannot_delete_self":
        return "Tu ne peux pas supprimer ton propre compte.";
      case "invalid_body":
        return "Vérifie les champs du formulaire.";
      default:
        return error.message;
    }
  }

  return "Une erreur inattendue est survenue.";
}

interface UserFormState {
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
}

const emptyForm: UserFormState = {
  username: "",
  displayName: "",
  password: "",
  role: "user",
};

function UserEditor({
  user,
  onCancel,
}: {
  user: User;
  onCancel: () => void;
}) {
  const updateMutation = useUpdateUserMutation();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user.role);

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void updateMutation
          .mutateAsync({
            userId: user.id,
            body: {
              displayName,
              role,
              ...(password.trim().length > 0 ? { password } : {}),
            },
          })
          .then(() => onCancel());
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={`displayName-${user.id}`}>Nom affiché</Label>
        <Input
          id={`displayName-${user.id}`}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`role-${user.id}`}>Rôle</Label>
        <select
          id={`role-${user.id}`}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
        >
          <option value="admin">Administrateur</option>
          <option value="user">Utilisateur</option>
          <option value="guest">Invité</option>
        </select>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`password-${user.id}`}>
          Nouveau mot de passe (optionnel)
        </Label>
        <Input
          id={`password-${user.id}`}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Laisser vide pour ne pas changer"
        />
      </div>

      {updateMutation.isError ? (
        <p className="text-sm text-destructive sm:col-span-2">
          {getErrorMessage(updateMutation.error)}
        </p>
      ) : null}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
          Enregistrer
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={updateMutation.isPending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

export function UsersPage() {
  const authQuery = useAuthQuery();
  const usersQuery = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const [createForm, setCreateForm] = useState<UserFormState>(emptyForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const currentUserId = authQuery.data?.user?.id;
  const users = usersQuery.data?.users ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Gère les comptes et les rôles Martylab (administrateur, utilisateur,
          invité).
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-4" aria-hidden="true" />
            Nouvel utilisateur
          </CardTitle>
          <CardDescription>
            Le mot de passe doit contenir au moins 8 caractères.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void createMutation
                .mutateAsync(createForm)
                .then(() => setCreateForm(emptyForm));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="create-username">Identifiant</Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder="prenom"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-displayName">Nom affiché</Label>
              <Input
                id="create-displayName"
                value={createForm.displayName}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                placeholder="Prénom"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Mot de passe</Label>
              <Input
                id="create-password"
                type="password"
                autoComplete="new-password"
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Rôle</Label>
              <select
                id="create-role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    role: event.target.value as UserRole,
                  }))
                }
              >
                <option value="admin">Administrateur</option>
                <option value="user">Utilisateur</option>
                <option value="guest">Invité</option>
              </select>
            </div>

            {createMutation.isError ? (
              <p className="text-sm text-destructive sm:col-span-2">
                {getErrorMessage(createMutation.error)}
              </p>
            ) : null}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                Créer l&apos;utilisateur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {usersQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">
          Chargement des utilisateurs…
        </p>
      ) : null}

      {usersQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs indisponibles</CardTitle>
            <CardDescription>
              Impossible de charger la liste des utilisateurs.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {usersQuery.data ? (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle>{user.displayName}</CardTitle>
                    <CardDescription>
                      @{user.username} · créé le {formatDate(user.createdAt)}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={roleBadgeVariant(user.role)}>
                      {roleLabels[user.role]}
                    </Badge>

                    {editingUserId !== user.id ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUserId(user.id)}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            deleteMutation.isPending ||
                            user.id === currentUserId
                          }
                          onClick={() => {
                            if (
                              window.confirm(
                                `Supprimer le compte « ${user.displayName} » ?`,
                              )
                            ) {
                              void deleteMutation.mutateAsync(user.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Supprimer
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardHeader>

              {editingUserId === user.id ? (
                <CardContent>
                  <UserEditor
                    user={user}
                    onCancel={() => setEditingUserId(null)}
                  />
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}

      {deleteMutation.isError ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(deleteMutation.error)}
        </p>
      ) : null}
    </div>
  );
}
