import { NavLink } from "react-router-dom";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
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
import { navItems } from "@/lib/nav-items";
import { canAccessNavItem } from "@/lib/nav-access";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar() {
  const authQuery = useAuthQuery();
  const logoutMutation = useLogoutMutation();
  const user = authQuery.data?.user;
  const visibleNavItems = navItems.filter((item) =>
    canAccessNavItem(user?.role, item),
  );

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="brand-gradient flex size-7 items-center justify-center rounded-lg text-sm font-semibold text-white">
          M
        </div>
        <span className="text-sm font-semibold tracking-tight">Martylab</span>
      </div>

      <nav
        aria-label="Navigation principale"
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2"
      >
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.status === "soon" ? (
              <span
                className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                aria-label="Bientôt disponible"
                title="Bientôt disponible"
              />
            ) : null}
          </NavLink>
        ))}
      </nav>

      {user ? (
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-sidebar-accent/60"
            >
              <Avatar size="sm">
                <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {user.displayName}
                </span>
                <span className="block truncate text-xs text-sidebar-foreground/60">
                  {user.role}
                </span>
              </span>
              <ChevronsUpDown
                className="size-3.5 shrink-0 text-sidebar-foreground/50"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <div className="flex items-center gap-2 px-1.5 py-1">
                <span className="text-sm font-medium">{user.displayName}</span>
                <Badge variant="secondary">{user.role}</Badge>
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
        </div>
      ) : null}
    </aside>
  );
}
