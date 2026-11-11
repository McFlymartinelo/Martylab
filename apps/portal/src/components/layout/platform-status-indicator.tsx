import { useHealthQuery } from "@/features/health/use-health-query";
import { resolvePlatformStatus, type PlatformTone } from "@/lib/platform-status";
import { cn } from "@/lib/utils";

const toneDotClass: Record<PlatformTone, string> = {
  pending: "bg-muted-foreground/50 animate-pulse",
  ok: "bg-success",
  warn: "bg-warn",
  danger: "bg-destructive",
};

const toneShortLabel: Record<PlatformTone, string> = {
  pending: "Vérification…",
  ok: "Opérationnel",
  warn: "Dégradé",
  danger: "Hors ligne",
};

export function PlatformStatusIndicator({ showLabel = false }: { showLabel?: boolean }) {
  const healthQuery = useHealthQuery();
  const { tone, label } = resolvePlatformStatus({
    isLoading: healthQuery.isLoading,
    isError: healthQuery.isError,
    status: healthQuery.data?.status,
    database: healthQuery.data?.database,
  });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        showLabel
          ? "h-9 rounded-full border border-border bg-card px-3 text-2xs font-medium text-muted-foreground"
          : "size-8 justify-center",
      )}
      title={label}
      aria-label={label}
    >
      <span
        className={cn("size-2.5 shrink-0 rounded-full", toneDotClass[tone])}
        aria-hidden="true"
      />
      {showLabel ? (
        <span className="hidden lg:inline">{toneShortLabel[tone]}</span>
      ) : null}
    </span>
  );
}
