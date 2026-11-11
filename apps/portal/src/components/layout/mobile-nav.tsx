import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { useLogoutMutation } from "@/features/auth/use-logout-mutation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { canAccessNavItem } from "@/lib/nav-access";
import { mobileNavItems, navItems, type NavItem } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const authQuery = useAuthQuery();
  const role = authQuery.data?.user?.role;
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleItems = navItems.filter((item) => canAccessNavItem(role, item));
  const primaryItems = mobileNavItems.filter((item) =>
    visibleItems.some((visible) => visible.id === item.id),
  );
  const secondaryItems = visibleItems.filter(
    (item) => typeof item.mobileOrder !== "number",
  );

  return (
    <>
      <nav
        aria-label="Navigation mobile"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5 items-end">
          {primaryItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex min-h-[52px] flex-col items-center justify-end gap-1 pb-1.5 text-2xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  item.mobileCta ? "" : "pt-1.5",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) =>
                item.mobileCta ? (
                  <>
                    <span
                      className={cn(
                        "-mt-5 flex size-11 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-transform group-active:scale-95",
                        isActive && "ring-2 ring-ring/40",
                      )}
                    >
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="max-w-full truncate px-0.5 font-medium">
                      {item.label}
                    </span>
                  </>
                ) : (
                  <>
                    <item.icon className="size-5" aria-hidden="true" />
                    <span className="max-w-full truncate px-0.5">
                      {item.id === "dashboard" ? "Accueil" : item.label}
                    </span>
                  </>
                )
              }
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className="flex min-h-[52px] flex-col items-center justify-center gap-1 py-1.5 text-2xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            <span>Plus</span>
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogBackdrop />
        <DialogPopup className="top-auto right-0 bottom-0 left-0 max-h-[85svh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl rounded-b-none border-x-0 border-b-0 pb-[calc(1rem+env(safe-area-inset-bottom))] data-open:slide-in-from-bottom data-closed:slide-out-to-bottom">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-heading text-base font-semibold">
              Plus
            </DialogTitle>
            <DialogClose
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Fermer le menu"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogClose>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {secondaryItems.map((item) => (
              <MoreSheetLink
                key={item.id}
                item={item}
                onNavigate={() => setMoreOpen(false)}
              />
            ))}
          </div>

          <div className="my-3 h-px bg-border" aria-hidden="true" />

          <LogoutButton onDone={() => setMoreOpen(false)} />
        </DialogPopup>
      </Dialog>
    </>
  );
}

function MoreSheetLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex min-h-11 flex-col items-start gap-1.5 rounded-xl bg-muted/60 p-3 text-2xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isActive
            ? "text-primary ring-1 ring-primary/40"
            : "text-foreground hover:bg-muted",
        )
      }
    >
      <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function LogoutButton({ onDone }: { onDone: () => void }) {
  const logoutMutation = useLogoutMutation();

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-11 w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={logoutMutation.isPending}
      onClick={() => {
        onDone();
        logoutMutation.mutate();
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Se déconnecter
    </Button>
  );
}
