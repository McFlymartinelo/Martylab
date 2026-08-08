import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthQuery } from "@/features/auth/use-auth-query";

export function RequireAuth() {
  const location = useLocation();
  const authQuery = useAuthQuery();

  if (authQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Vérification de la session…
      </div>
    );
  }

  if (authQuery.isError) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Authentification indisponible
        </h1>
        <p className="text-muted-foreground">
          Impossible de vérifier la session. Vérifiez que le backend et
          PostgreSQL sont démarrés.
        </p>
      </div>
    );
  }

  if (!authQuery.data?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
