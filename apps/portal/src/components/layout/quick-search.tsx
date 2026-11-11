import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { canAccessNavItem } from "@/lib/nav-access";
import { navGroupLabels, navItems, type NavItem } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

function shortcutLabel(): string {
  if (typeof navigator === "undefined") {
    return "Ctrl K";
  }
  return /mac|iphone|ipad/i.test(navigator.userAgent) ? "⌘ K" : "Ctrl K";
}

/**
 * Palette de commandes du shell (⌘/Ctrl + K).
 * Elle ne fait que naviguer : aucune commande n'est exécutée côté client.
 * Les entrées restent filtrées par rôle via `canAccessNavItem` (le backend
 * reste seul juge des autorisations).
 */
export function QuickSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const authQuery = useAuthQuery();
  const role = authQuery.data?.user?.role;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const listboxId = useId();
  const baseId = useId();
  const shortcut = shortcutLabel();

  const visibleItems = useMemo(
    () => navItems.filter((item) => canAccessNavItem(role, item)),
    [role],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return visibleItems;
    }

    return visibleItems.filter((item) => {
      const haystack = [
        item.label,
        item.description,
        navGroupLabels[item.group],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, visibleItems]);

  const safeActiveIndex =
    results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function go(item: NavItem) {
    setOpen(false);
    setQuery("");
    navigate(item.to);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length === 0 ? 0 : (current + 1) % results.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length === 0
          ? 0
          : (current - 1 + results.length) % results.length,
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, results.length - 1));
      return;
    }

    if (event.key === "Enter") {
      const item = results[safeActiveIndex];
      if (item) {
        event.preventDefault();
        go(item);
      }
    }
  }

  const optionId = (item: NavItem) => `${baseId}-option-${item.id}`;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={`Rechercher ou naviguer (${shortcut})`}
        aria-haspopup="dialog"
        className={cn(
          "h-9 gap-2 text-muted-foreground md:min-w-56 md:justify-start",
          className,
        )}
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden md:inline">Rechercher…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-2xs md:inline">
          {shortcut}
        </kbd>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <DialogBackdrop />
        <DialogPopup className="p-0">
          <DialogTitle className="sr-only">Rechercher dans Martylab</DialogTitle>

          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                safeActiveIndex >= 0
                  ? optionId(results[safeActiveIndex] as NavItem)
                  : undefined
              }
              placeholder="Rechercher une page…"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-2xs sm:inline">
              Échap
            </kbd>
          </div>

          <div
            role="listbox"
            id={listboxId}
            aria-label="Pages disponibles"
            className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5"
          >
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Aucune page ne correspond à « {query} ».
              </p>
            ) : (
              results.map((item, index) => (
                <div
                  key={item.id}
                  id={optionId(item)}
                  role="option"
                  aria-selected={index === safeActiveIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                    index === safeActiveIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground",
                  )}
                >
                  <item.icon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="shrink-0 font-mono text-2xs tracking-wide text-muted-foreground uppercase">
                    {navGroupLabels[item.group]}
                  </span>
                </div>
              ))
            )}
          </div>

          <p className="border-t border-border px-3 py-2 text-2xs text-muted-foreground">
            ↑ ↓ pour naviguer · Entrée pour ouvrir · les entrées dépendent de ton
            rôle
          </p>
        </DialogPopup>
      </Dialog>
    </>
  );
}
