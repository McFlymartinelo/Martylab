import { Download, MonitorSmartphone, Moon, Palette, Smartphone, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInstallPrompt } from "@/features/pwa/use-install-prompt";
import { cn } from "@/lib/utils";

const themeOptions = [
  {
    value: "dark",
    label: "Sombre",
    description: "Le thème par défaut du cockpit.",
    icon: Moon,
  },
  {
    value: "light",
    label: "Clair",
    description: "Pour les environnements lumineux.",
    icon: Sun,
  },
  {
    value: "system",
    label: "Système",
    description: "Suit le réglage de l'appareil.",
    icon: MonitorSmartphone,
  },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const install = useInstallPrompt();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-4 text-muted-foreground" />
            Thème
          </CardTitle>
          <CardDescription>
            La préférence est appliquée immédiatement et conservée sur cet
            appareil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="group"
            aria-label="Choix du thème"
            className="grid gap-2 sm:grid-cols-3"
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const selected = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-2xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="size-4 text-muted-foreground" />
            Application mobile (PWA)
          </CardTitle>
          <CardDescription>
            Installe Martylab sur ton smartphone ou ta tablette pour un accès
            plein écran, avec les notifications en arrière-plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {install.isInstalled ? (
            <p className="text-sm text-muted-foreground">
              Martylab est installé sur cet appareil.
            </p>
          ) : install.canInstall ? (
            <Button onClick={() => void install.promptInstall()}>
              <Download className="size-4" aria-hidden="true" />
              Installer l&apos;application
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sur iOS : partage Safari → « Sur l&apos;écran d&apos;accueil ».
              Sur Android : menu du navigateur → « Installer l&apos;application
              » ou via la bannière d&apos;installation.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
