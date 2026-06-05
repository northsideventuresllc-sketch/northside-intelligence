import { PORTAL_URL, SECTOR3_REGISTRY } from "@/lib/sector3-registry";

export const BRAND = {
  tagline: "Filling the gaps to build the future.",
  motto: "We don't sell out. We are the empire.",
  company: "Northside Intelligence",
  footer: "© 2026 Northside Intelligence",
  mission:
    "Building intelligence that works to advance livelihood by finding gaps, initializing creativity and innovation, and producing high-level improvements. In charge of building marketplaces, technology, artificial intelligence, systems, business tools, personal tools, and more.",
} as const;

export const REVENUE_GOAL_EOY_2026 = 500_000;

export type ToolStatus = "LIVE" | "COMING SOON";

export type ToolCategory =
  | "Automation"
  | "Intelligence"
  | "Orchestration"
  | "Productivity";

export interface Sector3Tool {
  name: string;
  subdomain: string;
  description: string;
  status: ToolStatus;
  category: ToolCategory;
  keywords: string[];
  url?: string;
  github?: string;
}

const wiredTools: Sector3Tool[] = SECTOR3_REGISTRY.map((t) => ({
  name: t.name,
  subdomain: t.subdomain,
  description: t.description,
  status: t.status,
  category: t.slug === "replyflow" ? "Automation" : "Intelligence",
  keywords:
    t.slug === "replyflow"
      ? ["customer service", "replies", "support", "email", "automation", "sector 3"]
      : ["grants", "nonprofit", "creators", "funding", "drafting", "sector 3"],
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
    category: "Intelligence",
    keywords: ["signals", "alerts", "hub", "monitoring", "sector 3"],
  },
  {
    name: "GapScan",
    subdomain: "Coming soon",
    description: "Automated workflow gap detection",
    status: "COMING SOON",
    category: "Productivity",
    keywords: ["gaps", "workflow", "audit", "detection", "sector 3"],
  },
  {
    name: "BridgeAI",
    subdomain: "Coming soon",
    description: "Cross-platform AI orchestration",
    status: "COMING SOON",
    category: "Orchestration",
    keywords: ["orchestration", "ai", "integration", "platform", "sector 3"],
  },
];

export const TOOL_CATEGORIES: ToolCategory[] = [
  "Automation",
  "Intelligence",
  "Orchestration",
  "Productivity",
];

export interface SectorProject {
  name: string;
  sector: "1A" | "1B";
  tagline: string;
  url?: string;
  logo: string;
  status: ToolStatus;
  keywords: string[];
}

export const SECTOR_1A_PROJECTS: SectorProject[] = [
  {
    name: "MatchFit",
    sector: "1A",
    tagline: "Athletic matching & fit intelligence",
    url: "https://match-fit.net",
    logo: "/logos/match-fit.svg",
    status: "LIVE",
    keywords: ["fitness", "matching", "athletes", "beta", "1a"],
  },
  {
    name: "Project Alpha",
    sector: "1A",
    tagline: "Sector 1A — coming soon",
    logo: "/ni-emblem.svg",
    status: "COMING SOON",
    keywords: ["1a", "future", "marketplace"],
  },
];

export const SECTOR_1B_PROJECTS: SectorProject[] = [
  {
    name: "StreamPass",
    sector: "1B",
    tagline: "Universal streaming intelligence",
    logo: "/logos/streampass.svg",
    status: "COMING SOON",
    keywords: ["streaming", "watchlist", "subscriptions", "1b"],
  },
  {
    name: "Project Beta",
    sector: "1B",
    tagline: "Sector 1B — coming soon",
    logo: "/ni-emblem.svg",
    status: "COMING SOON",
    keywords: ["1b", "future", "personal tools"],
  },
];

export const SECTOR_BANNER_PROJECTS: SectorProject[] = [
  ...SECTOR_1A_PROJECTS,
  ...SECTOR_1B_PROJECTS,
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
