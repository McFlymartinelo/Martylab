import { NavLink } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/features/auth/use-logout-mutation";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { navItems } from "@/lib/nav-items";
import { canAccessNavItem } from "@/lib/nav-access";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const logoutMutation = useLogoutMutation();
  const authQuery = useAuthQuery();
  const role = authQuery.data?.user?.role;
  const visibleNavItems = navItems.filter((item) => canAccessNavItem(role, item));
  const primaryItems = visibleNavItems.filter((item) => item.mobilePrimary);
  const secondaryItems = visibleNavItems.filter((item) => !item.mobilePrimary);

  return (
    <nav
      aria-label="Navigation mobile"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5">
        {primaryItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <item.icon className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate px-0.5">
              {item.id === "dashboard" ? "Accueil" : item.label}
            </span>
          </NavLink>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground outline-none hover:text-foreground">
            <MoreHorizontal className="size-5" aria-hidden="true" />
            <span>Plus</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            {secondaryItems.map((item) => (
              <DropdownMenuItem key={item.id} render={<NavLink to={item.to} />}>
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
