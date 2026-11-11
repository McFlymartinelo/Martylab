import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  mono?: boolean;
  className?: string;
  /** Hidden in the mobile card layout, where space is limited. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Table desktop et cartes mobile, avec libellés de colonne sur chaque valeur.
 * La sémantique de table est conservée sur desktop uniquement pour éviter un
 * balisage de table invalide sur mobile.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  emptyMessage = "Aucune donnée à afficher.",
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className={cn("px-4 py-6 text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full text-left text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="border-b border-border bg-muted/40 text-2xs text-muted-foreground uppercase">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    "px-3 py-2 font-medium whitespace-nowrap",
                    column.align === "right" && "text-right",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-border/60 last:border-0"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-3 py-2 align-top",
                      column.mono && "font-mono text-xs tabular-nums",
                      column.align === "right" && "text-right",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="rounded-xl border border-border bg-card p-3"
          >
            <dl className="space-y-1.5">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div
                    key={column.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <dt className="shrink-0 text-2xs tracking-wide text-muted-foreground uppercase">
                      {column.header}
                    </dt>
                    <dd
                      className={cn(
                        "min-w-0 text-right",
                        column.mono && "font-mono text-xs tabular-nums",
                      )}
                    >
                      {column.render(row)}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
