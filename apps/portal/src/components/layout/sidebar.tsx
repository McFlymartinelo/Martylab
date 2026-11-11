import { NavLink } from "react-router-dom";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { useHealthQuery } from "@/features/health/use-health-query";
import { usePluginsQuery } from "@/features/plugins/use-plugins-query";
import { useUsersQuery } from "@/features/users/use-users-query";
import { canAccessNavItem } from "@/lib/nav-access";
import {
  navGroups,
  navItems,
  type NavItem,
} from "@/lib/nav-items";
import { resolvePlatformStatus, type PlatformTone } from "@/lib/platform-status";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand-mark";
import { UserMenu } from "@/components/layout/user-menu";

const toneDotClass: Record<PlatformTone, string> = {
  pending: "bg-muted-foreground/50 animate-pulse",
  ok: "bg-success",
  warn: "bg-warn",
  danger: "bg-destructive",
};

const toneLabel: Record<PlatformTone, string> = {
  pending: "Vérification…",
  ok: "Tout est opérationnel",
  warn: "Incident partiel",
  danger: "Backend inaccessible",
};

function NavCount({ value }: { value: number | undefined }) {
  if (value === undefined) {
    return null;
  }

  return (
    <span className="ml-auto shrink-0 rounded-full bg-sidebar-accent px-1.5 font-mono text-2xs tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}

export function Sidebar() {
  const authQuery = useAuthQuery();
  const healthQuery = useHealthQuery();
  const user = authQuery.data?.user;

  const pluginsQuery = usePluginsQuery();
  const usersQuery = useUsersQuery(user?.role === "admin");

  const counts: Partial<Record<string, number | undefined>> = {
    apps: pluginsQuery.data?.plugins.length,
    users: usersQuery.data?.users.length,
  };

  const visibleItems = navItems.filter((item) =>
    canAccessNavItem(user?.role, item),
  );
  const groupedItems = navGroups
    .map((group) => ({
      group,
      items: visibleItems.filter((item) => item.group === group.id),
    }))
    .filter((entry) => entry.items.length > 0);

  const platform = resolvePlatformStatus({
    isLoading: healthQuery.isLoading,
    isError: healthQuery.isError,
    status: healthQuery.data?.status,
    database: healthQuery.data?.database,
  });

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <BrandMark className="size-6 shrink-0 text-sidebar-foreground" />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-sm font-semibold tracking-tight">
              Martylab
            </span>
            <span className="mt-1 font-mono text-2xs tracking-widest text-muted-foreground uppercase">
              self-hosted
            </span>
          </span>
        </NavLink>
      </div>

      <nav
        aria-label="Navigation principale"
        className="flex-1 overflow-y-auto px-3 pb-2"
      >
        {groupedItems.map(({ group, items }) => (
          <div key={group.id}>
            <div className="mt-3 mb-1 flex items-center gap-2 px-1.5">
              <span className="font-mono text-2xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {group.label}
              </span>
              <span className="h-px flex-1 bg-sidebar-border" aria-hidden="true" />
            </div>

            <div className="space-y-0.5">
              {items.map((item: NavItem) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group/nav relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      "before:absolute before:top-2 before:bottom-2 before:left-0 before:w-0.5 before:rounded-full",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground before:bg-primary"
                        : "text-muted-foreground before:bg-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.status === "soon" ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
                          title="Bientôt disponible"
                          aria-label="Bientôt disponible"
                        />
                      ) : (
                        <NavCount value={counts[item.id]} />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <p
          className="mb-2 flex items-center gap-2 px-1.5 text-2xs text-muted-foreground"
          title={platform.label}
        >
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              toneDotClass[platform.tone],
            )}
            aria-hidden="true"
          />
          <span className="truncate">{toneLabel[platform.tone]}</span>
        </p>

        {user ? <UserMenu user={user} variant="sidebar" /> : null}
      </div>
    </aside>
  );
}
