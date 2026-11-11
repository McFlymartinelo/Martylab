import { NavLink } from "react-router-dom";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import type { SessionUser } from "@martylab/shared";
import { useLogoutMutation } from "@/features/auth/use-logout-mutation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleLabels: Record<SessionUser["role"], string> = {
  admin: "Admin",
  user: "Utilisateur",
  guest: "Invité",
};

interface UserMenuProps {
  user: SessionUser;
  variant: "sidebar" | "topbar";
}

export function UserMenu({ user, variant }: UserMenuProps) {
  const logoutMutation = useLogoutMutation();

  const trigger =
    variant === "sidebar" ? (
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50">
        <Avatar size="sm">
          <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {user.displayName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {roleLabels[user.role]}
          </span>
        </span>
        <ChevronsUpDown
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
    ) : (
      <DropdownMenuTrigger
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Compte de ${user.displayName}`}
      >
        <Avatar size="sm">
          <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
    );

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "top" : "bottom"}
        className="w-56"
      >
        <div className="flex items-center gap-2 px-1.5 py-1">
          <span className="min-w-0 truncate text-sm font-medium">
            {user.displayName}
          </span>
          <Badge variant="secondary">{roleLabels[user.role]}</Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<NavLink to="/settings" />}>
          <Settings className="size-4" aria-hidden="true" />
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
