import {
  LayoutDashboard,
  Boxes,
  Cpu,
  KeyRound,
  Activity,
  BarChart3,
  ScrollText,
  HeartPulse,
  ShieldCheck,
  FlaskConical,
  CreditCard,
  Settings,
  Users,
  UserCog,
  Lock,
  History,
  Bell,
  User,
  CircleUser,
  BookOpen,
  Bot,
  BrainCircuit,
  GitBranch,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export interface NavSection {
  titleKey: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    titleKey: "nav.main",
    items: [
      { titleKey: "nav.dashboard", href: "/", icon: LayoutDashboard },
      { titleKey: "nav.providers", href: "/providers", icon: Boxes },
      { titleKey: "nav.models", href: "/models", icon: Cpu },
      { titleKey: "nav.apiKeys", href: "/api-keys", icon: KeyRound },
      { titleKey: "nav.agentStudio", href: "/agent", icon: BrainCircuit, badge: "Agent", badgeVariant: "default" },
      { titleKey: "nav.playground", href: "/playground", icon: FlaskConical },
      { titleKey: "nav.integrations", href: "/integrations", icon: Bot },
      { titleKey: "nav.repositories", href: "/repositories", icon: GitBranch },
    ],
  },
  {
    titleKey: "nav.monitoring",
    items: [
      { titleKey: "nav.usage", href: "/usage", icon: Activity },
      { titleKey: "nav.analytics", href: "/analytics", icon: BarChart3 },
      { titleKey: "nav.logs", href: "/logs", icon: ScrollText, badge: "Live", badgeVariant: "secondary" },
      { titleKey: "nav.health", href: "/health", icon: HeartPulse },
      { titleKey: "nav.validation", href: "/validation", icon: ShieldCheck },
    ],
  },
  {
    titleKey: "nav.administration",
    items: [
      { titleKey: "nav.billing", href: "/billing", icon: CreditCard },
      { titleKey: "nav.team", href: "/team", icon: Users },
      { titleKey: "nav.roles", href: "/roles", icon: UserCog },
      { titleKey: "nav.permissions", href: "/permissions", icon: Lock },
      { titleKey: "nav.auditLogs", href: "/audit-logs", icon: History },
      { titleKey: "nav.settings", href: "/settings", icon: Settings },
    ],
  },
  {
    titleKey: "nav.accountGroup",
    items: [
      { titleKey: "nav.notifications", href: "/notifications", icon: Bell },
      { titleKey: "nav.profile", href: "/profile", icon: User },
      { titleKey: "nav.account", href: "/account", icon: CircleUser },
      { titleKey: "nav.documentation", href: "/documentation", icon: BookOpen },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);

export const siteConfig = {
  name: "Moataz AI Gateway",
  shortName: "Moataz",
  description: "Unified AI Provider Management Platform",
  url: "https://moataz.ai",
  ogImage: "https://moataz.ai/og.png",
};
