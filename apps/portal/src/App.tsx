import type { HealthResponse } from "@martylab/shared";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const placeholderHealth: HealthResponse = {
  status: "ok",
  service: "martylab-backend",
  timestamp: new Date(0).toISOString(),
};

export function App() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Martylab v0.1
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Martylab
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Hub d&apos;applications personnel self-hosted. Une interface, des
            applications indépendantes.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Fondations</CardTitle>
          <CardDescription>
            Stack UI prête : Tailwind CSS v4, shadcn/ui (Base UI), thème sombre.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Portal React + Vite + TypeScript</li>
            <li>
              Contrats partagés via <code>@martylab/shared</code>
            </li>
            <li>
              Health contract ready: <code>{placeholderHealth.service}</code>
            </li>
          </ul>
          <Button type="button" variant="secondary">
            Design system ready
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
