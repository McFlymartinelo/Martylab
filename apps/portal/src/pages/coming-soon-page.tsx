import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { navItems } from "@/lib/nav-items";

export function ComingSoonPage() {
  const location = useLocation();
  const item = navItems.find((navItem) => navItem.to === location.pathname);

  const label = item?.label ?? "Cette page";
  const Icon = item?.icon ?? Sparkles;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{label}</h1>
      </section>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="brand-gradient flex size-14 items-center justify-center rounded-2xl text-primary-foreground">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-medium">Bientôt disponible</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              {item?.description ??
                "Cette fonctionnalité arrivera dans une prochaine version de Martylab."}
            </p>
          </div>
          <Button variant="secondary" size="sm" render={<Link to="/" />}>
            Retour au tableau de bord
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
