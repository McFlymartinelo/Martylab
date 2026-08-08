import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function QuickSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results =
    query.trim().length > 0
      ? navItems.filter((item) =>
          item.label.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : [];

  function go(to: string) {
    navigate(to);
    setQuery("");
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-sm", className)}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Rechercher…"
        aria-label="Rechercher dans Martylab"
        className="pl-8"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && results[0]) {
            go(results[0].to);
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open && results.length > 0 ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => go(item.to)}
            >
              <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {open && query.trim().length > 0 && results.length === 0 ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 rounded-lg border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md">
          Aucun résultat pour « {query} ».
        </div>
      ) : null}
    </div>
  );
}
