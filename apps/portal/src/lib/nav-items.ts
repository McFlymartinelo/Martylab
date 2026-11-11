import {
  Blocks,
  Bot,
  History,
  LayoutDashboard,
  Puzzle,
  Server,
  Settings,
  SquareTerminal,
  Trophy,
  Tv,
  Users,
  Workflow,
  Images,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@martylab/shared";

/**
 * Groupes de navigation du shell « Cockpit ».
 * L'ordre des groupes et des entrées suit le prototype ; les entrées
 * « Automatisations » et « Journal d'activité » sont conservées même si le
 * prototype ne les montre pas.
 */
export type NavGroupId =
  | "pilotage"
  | "infrastructure"
  | "univers"
  | "configuration";

export interface NavGroup {
  id: NavGroupId;
  label: string;
}

export const navGroups: NavGroup[] = [
  { id: "pilotage", label: "Pilotage" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "univers", label: "Univers" },
  { id: "configuration", label: "Configuration" },
];

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  group: NavGroupId;
  /** "ready" items link to a fully implemented page. "soon" items link to a placeholder. */
  status: "ready" | "soon";
  /** Shown on the placeholder page and in the quick-search results. */
  description: string;
  /** Position in the mobile tab bar (1-based). Omitted items live in the "Plus" sheet. */
  mobileOrder?: number;
  /** Highlighted as the raised central action of the mobile tab bar. */
  mobileCta?: boolean;
  /** Minimum role required to see this entry. */
  minRole?: UserRole;
}

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    to: "/",
    icon: LayoutDashboard,
    group: "pilotage",
    status: "ready",
    description: "Vue d'ensemble de ton laboratoire personnel.",
    mobileOrder: 1,
  },
  {
    id: "assistant",
    label: "Assistant",
    to: "/assistant",
    icon: Bot,
    group: "pilotage",
    status: "ready",
    description:
      "Conversation avec l'assistant Martylab et accès aux outils des plugins.",
    mobileOrder: 3,
    mobileCta: true,
  },
  {
    id: "system",
    label: "Système",
    to: "/system",
    icon: Server,
    group: "infrastructure",
    status: "ready",
    description:
      "Supervision CPU, RAM, disque, uptime et conteneurs Docker.",
    mobileOrder: 4,
  },
  {
    id: "services",
    label: "Services",
    to: "/services",
    icon: Workflow,
    group: "infrastructure",
    status: "ready",
    description:
      "Gestion des conteneurs Docker (démarrage, arrêt, logs) via le connecteur Docker.",
  },
  {
    id: "console",
    label: "Console",
    to: "/console",
    icon: SquareTerminal,
    group: "infrastructure",
    status: "ready",
    minRole: "admin",
    description:
      "Commandes typées avec audit et terminal conteneur réservé aux administrateurs.",
  },
  {
    id: "matchday",
    label: "Matchday",
    to: "/matchday",
    icon: Trophy,
    group: "univers",
    status: "ready",
    description:
      "Matchs du jour, classement, pronostics et messages du groupe.",
  },
  {
    id: "photos",
    label: "Photos",
    to: "/photos",
    icon: Images,
    group: "univers",
    status: "ready",
    description:
      "Bibliothèques Immich personnelles et partagées, albums et statistiques.",
  },
  {
    id: "jellyfin",
    label: "Jellyfin",
    to: "/jellyfin",
    icon: Tv,
    group: "univers",
    status: "ready",
    description:
      "Bibliothèques, lecture en cours, films, séries et statut du serveur.",
  },
  {
    id: "apps",
    label: "Applications",
    to: "/apps",
    icon: Blocks,
    group: "configuration",
    status: "ready",
    description: "Registre des plugins Martylab connectés à tes applications.",
    mobileOrder: 2,
  },
  {
    id: "settings",
    label: "Paramètres",
    to: "/settings",
    icon: Settings,
    group: "configuration",
    status: "ready",
    description: "Préférences du portail, PWA et notifications push.",
  },
  {
    id: "users",
    label: "Utilisateurs",
    to: "/users",
    icon: Users,
    group: "configuration",
    status: "ready",
    minRole: "admin",
    description:
      "Gestion des comptes et des rôles (admin, utilisateur, invité).",
  },
  {
    id: "plugins",
    label: "Plugins",
    to: "/plugins",
    icon: Puzzle,
    group: "configuration",
    status: "soon",
    description:
      "Marketplace pour installer de nouveaux plugins. Le registre actuel reste visible dans Applications.",
  },
  {
    id: "automations",
    label: "Automatisations",
    to: "/automations",
    icon: Workflow,
    group: "configuration",
    status: "soon",
    description: "Scénarios et automatisations multi-plugins.",
  },
  {
    id: "activity",
    label: "Journal d'activité",
    to: "/activity",
    icon: History,
    group: "configuration",
    status: "soon",
    description: "Historique des actions effectuées sur le laboratoire.",
  },
];

export const navGroupLabels = Object.fromEntries(
  navGroups.map((group) => [group.id, group.label]),
) as Record<NavGroupId, string>;

export const mobileNavItems = navItems
  .filter((item) => typeof item.mobileOrder === "number")
  .sort((a, b) => (a.mobileOrder ?? 0) - (b.mobileOrder ?? 0));
