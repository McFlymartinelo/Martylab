import { useAuthQuery } from "@/features/auth/use-auth-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { QuickSearch } from "@/components/layout/quick-search";

function firstName(displayName: string) {
  return displayName.split(" ")[0];
}

export function Topbar() {
  const authQuery = useAuthQuery();
  const user = authQuery.data?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {user ? `Bonjour ${firstName(user.displayName)} 👋` : "Martylab"}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            Voici un aperçu de ton laboratoire personnel.
          </p>
        </div>

        <QuickSearch className="hidden md:block" />

        <div className="flex items-center gap-2">
          <NotificationsMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
