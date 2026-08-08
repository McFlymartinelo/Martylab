import { Link } from "react-router-dom";
import { useHealthQuery } from "@/features/health/use-health-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function databaseLabel(status: string | undefined) {
  switch (status) {
    case "up":
      return "Online";
    case "down":
      return "Down";
    case "not_configured":
      return "Not configured";
    default:
      return "Unknown";
  }
}

export function DashboardPage() {
  const healthQuery = useHealthQuery();

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="max-w-2xl text-muted-foreground">
          Vue d&apos;ensemble Martylab. Les intégrations externes arriveront
          via le registre de plugins — aucune donnée inventée n&apos;est
          affichée ici.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Backend</CardTitle>
            <CardDescription>
              État de l&apos;API Martylab (`/api/health`).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {healthQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Vérification…</p>
            ) : null}

            {healthQuery.isError ? (
              <div className="space-y-2">
                <Badge variant="outline">Unavailable</Badge>
                <p className="text-sm text-muted-foreground">
                  Backend inaccessible pour le moment.
                </p>
              </div>
            ) : null}

            {healthQuery.data ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      healthQuery.data.status === "ok" ? "default" : "outline"
                    }
                  >
                    API {healthQuery.data.status}
                  </Badge>
                  <Badge variant="secondary">
                    DB {databaseLabel(healthQuery.data.database)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Service <code>{healthQuery.data.service}</code> —{" "}
                  {new Date(healthQuery.data.timestamp).toLocaleString("fr-FR")}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              Plugins et connecteurs exposés par Martylab.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Consultez le registre dès que des plugins seront enregistrés.
            </p>
            <Button variant="secondary" render={<Link to="/apps" />}>
              Voir les apps
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
