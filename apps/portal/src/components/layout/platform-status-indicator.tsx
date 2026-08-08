import { useHealthQuery } from "@/features/health/use-health-query";
import { cn } from "@/lib/utils";

function databaseLabel(status: string | undefined): string {
  switch (status) {
    case "up":
      return "Base de données en ligne.";
    case "down":
      return "Base de données indisponible.";
    case "not_configured":
      return "Base de données non configurée.";
    default:
      return "État de la base inconnu.";
  }
}

function resolveStatus(
  isLoading: boolean,
  isError: boolean,
  status: "ok" | "degraded" | undefined,
  database: string | undefined,
): { colorClass: string; label: string } {
  if (isLoading) {
    return {
      colorClass: "bg-muted-foreground/50 animate-pulse",
      label: "Vérification du statut…",
    };
  }

  if (isError || !status) {
    return {
      colorClass: "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.55)]",
      label: "Backend inaccessible.",
    };
  }

  if (status === "degraded") {
    return {
      colorClass: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]",
      label: `Incident partiel. ${databaseLabel(database)}`,
    };
  }

  return {
    colorClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]",
    label: `Opérationnel. ${databaseLabel(database)}`,
  };
}

export function PlatformStatusIndicator() {
  const healthQuery = useHealthQuery();
  const { colorClass, label } = resolveStatus(
    healthQuery.isLoading,
    healthQuery.isError,
    healthQuery.data?.status,
    healthQuery.data?.database,
  );

  return (
    <span
      className="flex size-8 items-center justify-center"
      title={label}
      aria-label={label}
    >
      <span className={cn("size-2.5 rounded-full", colorClass)} />
    </span>
  );
}
