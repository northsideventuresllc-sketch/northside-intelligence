export const BRAND = {
  tagline: "We find the gaps and make it better.",
  motto: "We don't sell out. We are the empire.",
  company: "Northside Intelligence",
  footer: "© 2026 Northside Intelligence | A Northside Ventures Group LLC Company",
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

export const SECTOR_3_TOOLS: Sector3Tool[] = [
  {
    name: "ReplyFlow",
    subdomain: "replyflow.northsideintelligence.com",
    description: "AI-powered reply automation",
    status: "LIVE",
    url: "https://replyflow.northsideintelligence.com",
    github: "https://github.com/northsideventuresllc-sketch",
  },
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

export const OPS_SECTOR_3_ROWS = [
  {
    name: "ReplyFlow",
    status: "LIVE" as const,
    subdomain: "replyflow.northsideintelligence.com",
    github: "https://github.com/northsideventuresllc-sketch",
  },
];

export const MATCH_FIT = {
  sector: "Sector 1A",
  domain: "match-fit.net",
  version: "v1.1.2-BETA",
  appUrl: "https://match-fit.net",
  adminUrl: "https://match-fit.net/admin",
  github: "https://github.com/northsideventuresllc-sketch",
};

export const QUICK_LINKS = [
  {
    label: "GitHub Org",
    href: "https://github.com/northsideventuresllc-sketch",
    icon: "github",
  },
  {
    label: "NI-Brain Supabase",
    href: "https://supabase.com/dashboard/project/kxijunwgbrlfzvgkhklo",
    icon: "database",
  },
  { label: "Vercel", href: "https://vercel.com", icon: "vercel" },
  { label: "Stripe", href: "https://dashboard.stripe.com", icon: "stripe" },
] as const;
