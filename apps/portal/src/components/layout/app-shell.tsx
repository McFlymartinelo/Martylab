import { NavLink, Outlet } from "react-router-dom";
import { Boxes, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { useLogoutMutation } from "@/features/auth/use-logout-mutation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/apps", label: "Apps", icon: Boxes, end: false },
] as const;

export function AppShell() {
  const authQuery = useAuthQuery();
  const logoutMutation = useLogoutMutation();
  const user = authQuery.data?.user;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <NavLink
            to="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Martylab
          </NavLink>

          <nav
            aria-label="Navigation principale"
            className="flex items-center gap-1"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )
                }
              >
                <item.icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm text-muted-foreground">
                    {user.displayName}
                  </span>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                render={<NavLink to="/login" />}
              >
                <LogIn className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Connexion</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
