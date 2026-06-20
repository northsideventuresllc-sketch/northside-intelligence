/** Canonical Sector 3 tool wiring — keep in sync with arm3_tools slugs in NI-Brain. */
export const NI_BRAIN_PROJECT_ID = "kxijunwgbrlfzvgkhklo" as const;
export const NI_BRAIN_SUPABASE_URL =
  `https://${NI_BRAIN_PROJECT_ID}.supabase.co` as const;
export const GITHUB_ORG = "northsideventuresllc-sketch" as const;
export const PORTAL_URL = "https://northsideintelligence.com" as const;
export const PORTAL_SIGNUP_URL = `${PORTAL_URL}/auth/signup` as const;
export const PORTAL_SIGNIN_URL = `${PORTAL_URL}/auth/signin` as const;

export type Sector3ToolSlug = "replyflow" | "grantbot";

export interface Sector3RegistryEntry {
  slug: Sector3ToolSlug;
  name: string;
  subdomain: string;
  description: string;
  status: "LIVE" | "COMING SOON";
  appUrl?: string;
  /** Relative dashboard path when hosted in the portal (e.g. `/replyflow/dashboard`). */
  dashboardPath?: string;
  /** Tool favicon path — must differ from NI portal `/icon.svg`. */
  favicon: string;
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
    appUrl: "https://northsideintelligence.com/replyflow",
    dashboardPath: "/replyflow/dashboard",
    favicon: "/replyflow/icon.svg",
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
    dashboardPath: "/grantbot/dashboard",
    favicon: "/logos/grantbot.svg",
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
