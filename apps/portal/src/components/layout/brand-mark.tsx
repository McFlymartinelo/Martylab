/**
 * Symbole officiel Martylab — grille 32, module 12, gouttière 4, rayon 3,5,
 * marge 2. Trois modules neutres (`currentColor`), un module actif en accent
 * (`fill-primary`, donc clair ou sombre selon le thème).
 *
 * Géométrie verrouillée : elle est identique aux fichiers livrés dans
 * `docs/brand/assets/logo/martylab-symbol.svg`. Purement décoratif,
 * `aria-hidden` par défaut.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="12" height="12" rx="3.5" fill="currentColor" />
      <rect x="18" y="2" width="12" height="12" rx="3.5" fill="currentColor" />
      <rect x="2" y="18" width="12" height="12" rx="3.5" fill="currentColor" />
      <rect x="18" y="18" width="12" height="12" rx="3.5" className="fill-primary" />
    </svg>
  );
}
