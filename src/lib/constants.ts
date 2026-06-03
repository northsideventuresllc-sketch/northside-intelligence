import { PORTAL_URL, SECTOR3_REGISTRY } from "@/lib/sector3-registry";

export const BRAND = {
  tagline: "Filling the gaps to build the future.",
  motto: "We don't sell out. We are the empire.",
  company: "Northside Intelligence",
  footer: "© 2026 Northside Intelligence",
} as const;

export const REVENUE_GOAL_EOY_2026 = 500_000;

export type ToolStatus = "LIVE" | "COMING SOON";

export interface Sector3Tool {
  name: string;
  subdomain: string;
  description: string;
  status: ToolStatus;
  url?: string;
  github?: string;
}

const wiredTools: Sector3Tool[] = SECTOR3_REGISTRY.map((t) => ({
  name: t.name,
  subdomain: t.subdomain,
  description: t.description,
  status: t.status,
  url: t.appUrl,
  github: t.github,
}));

export const SECTOR_3_TOOLS: Sector3Tool[] = [
  ...wiredTools,
  {
    name: "SignalDesk",
    subdomain: "Coming soon",
    description: "Unified intelligence signals hub",
    status: "COMING SOON",
  },
  {
    name: "GapScan",
    subdomain: "Coming soon",
    description: "Automated workflow gap detection",
    status: "COMING SOON",
  },
  {
    name: "BridgeAI",
    subdomain: "Coming soon",
    description: "Cross-platform AI orchestration",
    status: "COMING SOON",
  },
];

export const OPS_SECTOR_3_ROWS = SECTOR3_REGISTRY.map((t) => ({
  name: t.name,
  status: t.status,
  subdomain: t.subdomain,
  github: t.github,
  appUrl: t.appUrl,
}));

export const MATCH_FIT = {
  sector: "Sector 1A",
  domain: "match-fit.net",
  version: "v1.1.2-BETA",
  appUrl: "https://match-fit.net",
  adminUrl: "https://match-fit.net/admin",
  github: "https://github.com/northsideventuresllc-sketch/matchfit",
};

export const QUICK_LINKS = [
  {
    label: "ReplyFlow Repo",
    href: "https://github.com/northsideventuresllc-sketch/replyflow",
    icon: "github",
  },
  {
    label: "GrantBot Repo",
    href: "https://github.com/northsideventuresllc-sketch/grantbot",
    icon: "github",
  },
  {
    label: "NI Portal",
    href: PORTAL_URL,
    icon: "vercel",
  },
  {
    label: "NI-Brain Supabase",
    href: "https://supabase.com/dashboard/project/kxijunwgbrlfzvgkhklo",
    icon: "database",
  },
  { label: "Stripe", href: "https://dashboard.stripe.com", icon: "stripe" },
] as const;
