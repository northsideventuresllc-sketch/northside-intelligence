import { PORTAL_URL, SECTOR3_REGISTRY } from "@/lib/sector3-registry";

export const BRAND = {
  tagline: "Filling the gaps to build the future.",
  motto: "We don't sell out. We are the empire.",
  company: "Northside Intelligence",
  venturesGroup: "Northside Ventures Group",
  mission:
    "Building intelligence that works to advance livelihood by finding gaps, initializing creativity and innovation, and producing high-level improvements. In charge of building marketplaces, technology, artificial intelligence, systems, business tools, personal tools, and more.",
} as const;

export function getCopyrightYear(): number {
  return new Date().getFullYear();
}

export const REVENUE_GOAL_EOY_2026 = 500_000;

export type ToolStatus = "LIVE" | "COMING SOON";

export type ToolCategory =
  | "Automation"
  | "Intelligence"
  | "Orchestration"
  | "Productivity";

export interface IntelligenceTool {
  name: string;
  slug: string;
  subdomain: string;
  description: string;
  status: ToolStatus;
  category: ToolCategory;
  keywords: string[];
  logo: string;
  brandColor: string;
  brandGradient: string;
  url?: string;
  github?: string;
}

const TOOL_BRAND: Record<
  string,
  { logo: string; brandColor: string; brandGradient: string }
> = {
  replyflow: {
    logo: "/logos/replyflow.svg",
    brandColor: "#fb7185",
    brandGradient: "from-rose-400 via-orange-400 to-violet-400",
  },
  grantbot: {
    logo: "/logos/grantbot.svg",
    brandColor: "#34d399",
    brandGradient: "from-emerald-400 to-amber-400",
  },
  signaldesk: {
    logo: "/logos/signaldesk.svg",
    brandColor: "#38bdf8",
    brandGradient: "from-sky-400 to-cyan-300",
  },
  gapscan: {
    logo: "/logos/gapscan.svg",
    brandColor: "#f59e0b",
    brandGradient: "from-amber-400 to-orange-500",
  },
  bridgeai: {
    logo: "/logos/bridgeai.svg",
    brandColor: "#818cf8",
    brandGradient: "from-indigo-400 to-purple-400",
  },
};

const wiredTools: IntelligenceTool[] = SECTOR3_REGISTRY.map((t) => ({
  name: t.name,
  slug: t.slug,
  subdomain: t.subdomain,
  description: t.description,
  status: t.status,
  category: t.slug === "replyflow" ? "Automation" : "Intelligence",
  keywords:
    t.slug === "replyflow"
      ? ["customer service", "replies", "support", "email", "automation"]
      : ["grants", "nonprofit", "creators", "funding", "drafting"],
  url: t.appUrl,
  github: t.github,
  ...TOOL_BRAND[t.slug],
}));

export const INTELLIGENCE_TOOLS: IntelligenceTool[] = [
  ...wiredTools,
  {
    name: "SignalDesk",
    slug: "signaldesk",
    subdomain: "Coming soon",
    description: "Unified intelligence signals hub",
    status: "COMING SOON",
    category: "Intelligence",
    keywords: ["signals", "alerts", "hub", "monitoring"],
    ...TOOL_BRAND.signaldesk,
  },
  {
    name: "GapScan",
    slug: "gapscan",
    subdomain: "Coming soon",
    description: "Automated workflow gap detection",
    status: "COMING SOON",
    category: "Productivity",
    keywords: ["gaps", "workflow", "audit", "detection"],
    ...TOOL_BRAND.gapscan,
  },
  {
    name: "BridgeAI",
    slug: "bridgeai",
    subdomain: "Coming soon",
    description: "Cross-platform AI orchestration",
    status: "COMING SOON",
    category: "Orchestration",
    keywords: ["orchestration", "ai", "integration", "platform"],
    ...TOOL_BRAND.bridgeai,
  },
];

/** @deprecated Use INTELLIGENCE_TOOLS */
export const SECTOR_3_TOOLS = INTELLIGENCE_TOOLS;

export type Sector3Tool = IntelligenceTool;

export const REPORT_BUG_TOOLS = INTELLIGENCE_TOOLS.map((t) => ({
  value: t.slug,
  label: t.name,
}));

export const TOOL_CATEGORIES: ToolCategory[] = [
  "Automation",
  "Intelligence",
  "Orchestration",
  "Productivity",
];

export interface EcosystemProject {
  name: string;
  tagline: string;
  url?: string;
  logo: string;
  status: ToolStatus;
  keywords: string[];
}

export const ECOSYSTEM_LABS_LIVE: EcosystemProject[] = [
  {
    name: "Match Fit",
    tagline: "Athletic matching & fit intelligence",
    url: "https://match-fit.net",
    logo: "/logos/match-fit.png",
    status: "LIVE",
    keywords: ["fitness", "matching", "athletes", "beta"],
  },
];

export const ECOSYSTEM_LABS_COMING_SOON: EcosystemProject[] = [
  {
    name: "StreamPass",
    tagline: "Universal streaming intelligence",
    logo: "/logos/streampass.svg",
    status: "COMING SOON",
    keywords: ["streaming", "watchlist", "subscriptions"],
  },
  {
    name: "WavScope",
    tagline: "Audio intelligence & waveform analysis",
    logo: "/logos/wavscope.svg",
    status: "COMING SOON",
    keywords: ["audio", "waveform", "analysis", "scope"],
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
