import { Download, X } from "lucide-react";
import { useInstallPrompt } from "@/features/pwa/use-install-prompt";
import { Button } from "@/components/ui/button";

export function InstallBanner() {
  const install = useInstallPrompt();

  if (!install.canInstall || install.dismissed) {
    return null;
  }

  return (
    <div className="border-b border-border/80 bg-accent/40 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Installer Martylab</p>
          <p className="text-xs text-muted-foreground">
            Ajoute le portail à ton écran d&apos;accueil pour un accès rapide.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" onClick={() => void install.promptInstall()}>
            <Download className="size-4" />
            Installer
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Masquer la suggestion d'installation"
            onClick={install.dismiss}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
