import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-start justify-center gap-4">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page introuvable</h1>
      <p className="max-w-md text-muted-foreground">
        La ressource demandée n&apos;existe pas dans le portail Martylab.
      </p>
      <Button render={<Link to="/" />}>Retour au dashboard</Button>
    </div>
  );
}
