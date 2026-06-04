/** Canonical Sector 3 tool wiring — keep in sync with arm3_tools slugs in NI-Brain. */
export const NI_BRAIN_PROJECT_ID = "kxijunwgbrlfzvgkhklo" as const;
export const NI_BRAIN_SUPABASE_URL =
  `https://${NI_BRAIN_PROJECT_ID}.supabase.co` as const;
export const GITHUB_ORG = "northsideventuresllc-sketch" as const;
export const PORTAL_URL = "https://northsideintelligence.com" as const;

export type Sector3ToolSlug = "replyflow" | "grantbot";

export interface Sector3RegistryEntry {
  slug: Sector3ToolSlug;
  name: string;
  subdomain: string;
  description: string;
  status: "LIVE" | "COMING SOON";
  appUrl?: string;
  github: string;
  supabaseTable: string;
  arm3Status: string;
}

export const SECTOR3_REGISTRY: Sector3RegistryEntry[] = [
  {
    slug: "replyflow",
    name: "ReplyFlow",
    subdomain: "replyflow.northsideintelligence.com",
    description: "AI-powered customer service reply automation",
    status: "LIVE",
    appUrl: "https://replyflow-murex.vercel.app",
    github: `https://github.com/${GITHUB_ORG}/replyflow`,
    supabaseTable: "replyflow_profiles",
    arm3Status: "scale",
  },
  {
    slug: "grantbot",
    name: "GrantBot",
    subdomain: "grantbot.northsideintelligence.com",
    description: "AI grant finder and drafter for nonprofits and creators",
    status: "COMING SOON",
    github: `https://github.com/${GITHUB_ORG}/grantbot`,
    supabaseTable: "grantbot_profiles",
    arm3Status: "scale",
  },
];

export function getSector3BySlug(slug: Sector3ToolSlug): Sector3RegistryEntry {
  const entry = SECTOR3_REGISTRY.find((t) => t.slug === slug);
  if (!entry) {
    throw new Error(`Unknown Sector 3 tool slug: ${slug}`);
  }
  return entry;
}
