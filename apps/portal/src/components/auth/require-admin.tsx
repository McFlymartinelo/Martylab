import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuthQuery } from "@/features/auth/use-auth-query";
import { FullPageState } from "@/components/feedback/full-page-state";

export function RequireAdmin() {
  const authQuery = useAuthQuery();
  const user = authQuery.data?.user;

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return (
      <FullPageState
        icon={ShieldAlert}
        iconClassName="bg-destructive/10 text-destructive"
        title="Accès réservé aux administrateurs"
        description="Tu n'as pas les permissions nécessaires pour consulter cette page."
      />
    );
  }

  return <Outlet />;
}
