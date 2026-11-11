import type { DatabaseHealth } from "@martylab/shared";

export type PlatformTone = "pending" | "ok" | "warn" | "danger";

export interface PlatformStatus {
  tone: PlatformTone;
  label: string;
}

interface ResolvePlatformStatusArgs {
  isLoading: boolean;
  isError: boolean;
  status: "ok" | "degraded" | undefined;
  database: DatabaseHealth | undefined;
}

function databaseLabel(status: DatabaseHealth | undefined): string {
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

export function resolvePlatformStatus({
  isLoading,
  isError,
  status,
  database,
}: ResolvePlatformStatusArgs): PlatformStatus {
  if (isLoading) {
    return { tone: "pending", label: "Vérification du statut…" };
  }

  if (isError || !status) {
    return { tone: "danger", label: "Backend inaccessible." };
  }

  if (status === "degraded") {
    return {
      tone: "warn",
      label: `Incident partiel. ${databaseLabel(database)}`,
    };
  }

  return {
    tone: "ok",
    label: `Opérationnel. ${databaseLabel(database)}`,
  };
}
