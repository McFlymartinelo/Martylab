import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FullPageState } from "@/components/feedback/full-page-state";

export function NotFoundPage() {
  return (
    <FullPageState
      icon={Compass}
      title="Page introuvable"
      description="La ressource demandée n'existe pas dans le portail Martylab."
      action={
        <Button size="sm" render={<Link to="/" />}>
          Retour au tableau de bord
        </Button>
      }
    />
  );
}
