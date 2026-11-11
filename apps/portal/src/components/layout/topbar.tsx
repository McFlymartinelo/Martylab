import { useLocation } from "react-router-dom";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/layout/brand-mark";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { PlatformStatusIndicator } from "@/components/layout/platform-status-indicator";
import { QuickSearch } from "@/components/layout/quick-search";
import { UserMenu } from "@/components/layout/user-menu";
import { navItems } from "@/lib/nav-items";

function usePageLabel(): string {
  const location = useLocation();
  const item = navItems.find(
    (navItem) =>
      navItem.to === location.pathname ||
      (navItem.to !== "/" && location.pathname.startsWith(`${navItem.to}/`)),
  );
  return item?.label ?? "Martylab";
}

export function Topbar() {
  const authQuery = useAuthQuery();
  const user = authQuery.data?.user;
  const pageLabel = usePageLabel();

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <BrandMark className="size-5 shrink-0 text-foreground md:hidden" />
          <h1 className="truncate font-heading text-sm font-semibold tracking-tight md:hidden">
            {pageLabel}
          </h1>
          <QuickSearch className="ml-auto shrink-0 md:ml-0 md:w-80" />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <PlatformStatusIndicator showLabel />
          <NotificationsMenu />
          <ThemeToggle />
          {user ? <UserMenu user={user} variant="topbar" /> : null}
        </div>
      </div>
    </header>
  );
}
