import { Navigate, Outlet, useLocation } from "react-router-dom";
import { DatabaseZap, Loader2, WifiOff } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FullPageState } from "@/components/feedback/full-page-state";

export function RequireAuth() {
  const location = useLocation();
  const authQuery = useAuthQuery();

  if (authQuery.isLoading) {
    return (
      <FullPageState
        icon={Loader2}
        spin
        title="Vérification de la session…"
      />
    );
  }

  if (authQuery.isError) {
    const error = authQuery.error;
    const isDatabaseUnavailable =
      error instanceof ApiClientError && error.code === "database_unavailable";

    return (
      <FullPageState
        icon={isDatabaseUnavailable ? DatabaseZap : WifiOff}
        iconClassName="bg-destructive/10 text-destructive"
        title={
          isDatabaseUnavailable
            ? "Base de données indisponible"
            : "Backend inaccessible"
        }
        description={
          isDatabaseUnavailable
            ? "Le backend tourne mais ne peut pas joindre PostgreSQL. Vérifie DATABASE_URL et que la base est démarrée."
            : "Impossible de joindre le backend Martylab. Vérifie qu'il est démarré."
        }
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void authQuery.refetch()}
          >
            Réessayer
          </Button>
        }
      />
    );
  }

  if (!authQuery.data?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
