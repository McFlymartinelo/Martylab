import {
  Blocks,
  Bot,
  History,
  LayoutDashboard,
  Puzzle,
  Server,
  Settings,
  Trophy,
  Tv,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@martylab/shared";

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** "ready" items link to a fully implemented page. "soon" items link to a placeholder. */
  status: "ready" | "soon";
  /** Shown on the placeholder page and in the quick-search results. */
  description: string;
  /** Included in the condensed mobile bottom bar. */
  mobilePrimary?: boolean;
  /** Minimum role required to see this entry. */
  minRole?: UserRole;
}

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    to: "/",
    icon: LayoutDashboard,
    status: "ready",
    description: "Vue d'ensemble de ton laboratoire personnel.",
    mobilePrimary: true,
  },
  {
    id: "assistant",
    label: "Assistant",
    to: "/assistant",
    icon: Bot,
    status: "ready",
    description:
      "Conversation avec l'assistant Martylab et accès aux outils des plugins.",
    mobilePrimary: true,
  },
  {
    id: "apps",
    label: "Applications",
    to: "/apps",
    icon: Blocks,
    status: "ready",
    description: "Registre des plugins Martylab connectés à tes applications.",
    mobilePrimary: true,
  },
  {
    id: "system",
    label: "Système",
    to: "/system",
    icon: Server,
    status: "ready",
    description:
      "Supervision CPU, RAM, disque, uptime et conteneurs Docker.",
    mobilePrimary: true,
  },
  {
    id: "services",
    label: "Services",
    to: "/services",
    icon: Workflow,
    status: "ready",
    description:
      "Gestion des conteneurs Docker (démarrage, arrêt, logs) via le connecteur Docker.",
  },
  {
    id: "users",
    label: "Utilisateurs",
    to: "/users",
    icon: Users,
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
    status: "soon",
    description:
      "Marketplace pour installer de nouveaux plugins. Le registre actuel reste visible dans Applications.",
  },
  {
    id: "automations",
    label: "Automations",
    to: "/automations",
    icon: Workflow,
    status: "soon",
    description: "Scénarios et automatisations multi-plugins.",
  },
  {
    id: "activity",
    label: "Journal d'activité",
    to: "/activity",
    icon: History,
    status: "soon",
    description: "Historique des actions effectuées sur le laboratoire.",
  },
  {
    id: "settings",
    label: "Paramètres",
    to: "/settings",
    icon: Settings,
    status: "soon",
    description: "Préférences du portail et configuration générale.",
  },
  {
    id: "matchday",
    label: "Matchday",
    to: "/matchday",
    icon: Trophy,
    status: "ready",
    description:
      "Matchs du jour, classement, pronostics et messages du groupe.",
  },
  {
    id: "jellyfin",
    label: "Jellyfin",
    to: "/jellyfin",
    icon: Tv,
    status: "ready",
    description:
      "Bibliothèques, lecture en cours, films, séries et statut du serveur.",
  },
];
