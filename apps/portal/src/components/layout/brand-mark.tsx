/**
 * Marque Martylab du prototype « Cockpit » : quatre carrés, le dernier
 * reprend l'accent signal. Purement décoratif, `aria-hidden` par défaut.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="2" width="13" height="13" rx="4" fill="currentColor" />
      <rect
        x="17"
        y="2"
        width="13"
        height="13"
        rx="4"
        fill="currentColor"
        opacity="0.32"
      />
      <rect
        x="2"
        y="17"
        width="13"
        height="13"
        rx="4"
        fill="currentColor"
        opacity="0.32"
      />
      <rect
        x="17"
        y="17"
        width="13"
        height="13"
        rx="4"
        className="fill-primary"
      />
    </svg>
  );
}
