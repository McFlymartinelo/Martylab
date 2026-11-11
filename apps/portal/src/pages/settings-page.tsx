import { useSearchParams } from "react-router-dom";
import {
  Bell,
  Info,
  Palette,
  Plug,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/cockpit/page-header";
import { AboutSection } from "@/components/settings/about-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { IntegrationsSection } from "@/components/settings/integrations-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { cn } from "@/lib/utils";

interface SettingsSection {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const sections: SettingsSection[] = [
  {
    id: "profil",
    label: "Profil",
    description: "Ton identité, ton rôle et ta session.",
    icon: UserRound,
  },
  {
    id: "apparence",
    label: "Apparence",
    description: "Thème et installation de l'application mobile.",
    icon: Palette,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alertes push et prérequis navigateur.",
    icon: Bell,
  },
  {
    id: "securite",
    label: "Sécurité",
    description: "Sessions actives et révocation des appareils.",
    icon: ShieldCheck,
  },
  {
    id: "integrations",
    label: "Intégrations",
    description: "État réel des connecteurs configurés sur le serveur.",
    icon: Plug,
  },
  {
    id: "a-propos",
    label: "Système & à propos",
    description: "Version, santé du backend et rapport de diagnostics.",
    icon: Info,
  },
];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("section");
  const active = sections.some((section) => section.id === requested)
    ? requested!
    : sections[0]!.id;
  const activeSection = sections.find((section) => section.id === active)!;

  function select(id: string) {
    setSearchParams({ section: id }, { replace: true });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configuration · Portail"
        title="Paramètres"
        description="Profil, apparence, notifications, sécurité et état des intégrations. Les secrets restent sur le serveur : rien de sensible n'est exposé ici."
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <nav
          aria-label="Sections des paramètres"
          className="w-full shrink-0 md:w-56"
        >
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 md:flex-col md:overflow-visible">
            {sections.map((section) => {
              const Icon = section.icon;
              const selected = section.id === activeSection.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  onClick={() => select(section.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:w-full md:whitespace-normal",
                    selected
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate text-left">{section.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              {activeSection.label}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeSection.description}
            </p>
          </div>

          {activeSection.id === "profil" ? <ProfileSection /> : null}
          {activeSection.id === "apparence" ? <AppearanceSection /> : null}
          {activeSection.id === "notifications" ? (
            <NotificationsSection />
          ) : null}
          {activeSection.id === "securite" ? <SecuritySection /> : null}
          {activeSection.id === "integrations" ? <IntegrationsSection /> : null}
          {activeSection.id === "a-propos" ? <AboutSection /> : null}
        </div>
      </div>
    </div>
  );
}
