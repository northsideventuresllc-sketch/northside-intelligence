import type { ContentPostType } from "./types";

export const CONTENT_DAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const CONTENT_POST_TYPES: ContentPostType[] = [
  "Carousel",
  "Static",
  "Video",
  "Text",
];

export const PLATFORMS_BY_TYPE: Record<ContentPostType, string[]> = {
  Carousel: ["Instagram", "Facebook"],
  Static: ["Instagram", "Facebook", "LinkedIn"],
  Video: ["Instagram Reels", "TikTok", "Facebook Reels"],
  Text: ["Threads", "Facebook", "LinkedIn"],
};

/**
 * RETIRED by JB's locked high-volume hashtag rule (MF-HASHTAG-HIGHVOL, 2026-08-04).
 *
 * This list used to ban #FitnessMotivation, #GymLife, #FitFam, #NoPainNoGain and
 * #MotivationMonday — the highest-volume tags in the niche. Banning them is what
 * pushed the generator toward invented long-tail tags in the first place. JB's rule
 * is now the inverse: high-follower, already-popular tags ONLY.
 *
 * Allow-listing lives in hashtag-policy.ts. This stays exported (and empty) so the
 * quality gate keeps a hook for genuinely banned tags without reintroducing the
 * old inverted behaviour.
 */
export const BANNED_HASHTAGS: string[] = [];

export const DEFAULT_BRAND_SLUG = "match-fit";

export const MAX_REGEN_ATTEMPTS = 2;

/**
 * NI-AXONGEN-ALL-TIERS-DOWN-0907: axonGenerate's local (Mac mini) tier defaults to a
 * 130s/155s timeout budget, proven-safe for a single-shot caller riding out a cold Ollama
 * load. generateSlotWithQualityGate calls generateSlotDraft up to MAX_REGEN_ATTEMPTS + 1 = 3
 * times per slot, each attempt walking the chain from local again on failure -- at the
 * router's own default that is up to 3 * 155s = 465s against this route's 300s Vercel
 * maxDuration, before any tier even answers. Content-machine passes this shorter budget as
 * generateTextGeminiFirst's localTimeoutMs instead, matching the local tier's old (pre-fix)
 * failure-fast behavior so 3 attempts still fit well inside 300s; every other caller of the
 * router (chat, negotiate, etc.) is unaffected and keeps the longer, cold-load-tolerant
 * default since none of them retry the whole chain internally.
 */
export const CONTENT_MACHINE_LOCAL_TIER_TIMEOUT_MS = 45_000;
export const MAX_HASHTAGS = 5;
export const MIN_VISUAL_PROMPT_CHARS = 80;
export const MIN_CONCRETE_DETAILS = 2;

/**
 * BUILD fix 2026-09-07 (content-machine wrong-brand bug): content_machine_brand_profiles
 * rows for the 5 NI-family brands only ever carried {tone, platforms} voice_rules — no real
 * product facts to ground the model. Combined with buildSystemPrompt's old hardcoded
 * Match-Fit-only quality bullets ("Always say Fitness Pros", "2 concrete Match Fit
 * features"), every one of these brands' prompts was implicitly telling the model to write
 * about Match Fit, and countConcreteDetails() (quality-gate.ts) was scoring "concrete
 * detail" against Match Fit vocabulary for every brand. Real rows in content_machine_posts,
 * brand_slug in ('ni','ni-store','grantbot','gapscan','bridgeai'), created_at 2026-09-07
 * 16:06-16:09 UTC — every caption was Match Fit copy despite banned_phrases containing the
 * literal string "Match Fit" for all five. Facts sourced from this repo's own live product
 * surfaces (sector3-registry.ts, configs.ts, store/branding.ts, grantbot/page.tsx,
 * gapscan/page.tsx, bridgeai/layout.tsx, lib/constants.ts BRAND) — not invented. Mirrors the
 * CONTENT_CALENDAR_BRAND_FACTS pattern in matchfit/src/lib/content-calendar/constants.ts.
 */
export const CONTENT_MACHINE_BRAND_FACTS: Record<string, string> = {
  // Mirrored from CONTENT_CALENDAR_BRAND_FACTS in matchfit/src/lib/content-calendar/constants.ts
  // (that repo's real, JB-approved Match Fit facts block) — not a placeholder. Match Fit's own
  // dedicated weekly generator lives in the matchfit repo and content_machine_posts inserts for
  // brand_slug='match-fit' are redirected server-side into match_fit_content_calendar_posts (see
  // insertPost() in db.ts) — but generateSlotDraft()/buildSystemPrompt() here can still run for
  // brand_slug='match-fit' (DEFAULT_BRAND_SLUG, and any caller that omits brandSlug), so this
  // entry must exist or match-fit itself regresses to the "no product facts configured" fallback.
  "match-fit": `Match Fit — two-sided fitness marketplace connecting Fitness Pros with clients.
Beta v1.2+. Clients: $10/month. Independent Pro from $15/month after a 60-day free trial at registration. 20% platform fee on sessions.
Features: swipe-based discovery, Fit Hub social feed, algorithmic matching, virtual + in-person. Match Fit is worldwide — do NOT name a city, metro or region in marketing, and never imply a launch is limited to one place.
Brand: bold, direct, real — no fluff. Colors: dark #07080C, orange #FF7E00. Handle: @theofficialmatchfit
Target audiences: "Join the Team" (Fitness Pros joining Match Fit), "List With Us" (independent Fitness Pros & facilities using Match Fit for listing/discovery), "Clients" (athletes and individuals looking for training).
Goal: grow beta Fitness Pros and clients. Site: match-fit.net
Founding Fitness Pro promo (exact meaning; vary wording every time): first 30 Fitness Pros get 60 days of Premium access free (all tools / maximize opportunity); first 10 Fitness Pros get onboarding fees waived completely.`,
  ni: `NORTHSiDE Intelligence (NI) — Northside Ventures' AI/software venture builder and consumer-facing hub. Tagline: "Filling the gaps to build the future."
Ties together a portal of Sector 3 AI tools: ReplyFlow (AI-powered customer service reply automation), GrantBot (AI grant finder and drafter for nonprofits/creators), GapScan (automated workflow gap detection), BridgeAI (cross-platform AI orchestration), Signal Desk (unified intelligence signals hub) — plus Smart Store, a standalone ecommerce storefront.
One free Northside Intelligence account unlocks the toolkit. Site: northsideintelligence.com.
This is the NI brand itself — do not write about Match Fit (a separate Northside venture, a fitness marketplace) or any single Sector 3 tool as if it were the whole product.`,
  "ni-store": `Smart Store — Northside Intelligence's standalone ecommerce storefront (not an AI intelligence tool). Sells curated physical products across Kitchen, Tech, Home, Pets, Health, Beauty, Fitness, Auto, Entertainment and Smart Home categories.
Site: northsideintelligence.com/store. Part of the Northside Intelligence account/portal.
Never describe this as an AI tool, a fitness marketplace, or use Match Fit language (Fitness Pros, founding slots, Fit Hub) — Smart Store sells physical products, it has no trainers, coaches or booking.`,
  grantbot: `GrantBot — AI grant finder and drafter for nonprofits, creators, researchers, small businesses, and arts & culture organizations. Powered by Claude, part of Northside Intelligence.
Describe your organization; GrantBot finds relevant funding opportunities and drafts compelling grant applications. One Northside Intelligence account unlocks it. Site: northsideintelligence.com/grantbot.
Categories it serves: Nonprofit, Creator, Research, Small Business, Arts & Culture. Never mention Match Fit, Fitness Pros, or fitness-marketplace language — GrantBot has nothing to do with fitness.`,
  gapscan: `GapScan — automated workflow, product, and market gap-detection tool, part of Northside Intelligence's Sector 3 toolkit.
Describe a workflow, product, or market; GapScan surfaces severity-ranked gaps and quick wins (e.g. "critical gap: no guided first-run within 60 seconds; moderate: missing template library at signup"). Site: northsideintelligence.com/gapscan.
Never mention Match Fit, Fitness Pros, or fitness-marketplace language — GapScan is a workflow/product analysis tool, not a fitness product.`,
  bridgeai: `BridgeAI — cross-platform AI orchestration tool, part of Northside Intelligence's Sector 3 toolkit. Produces integration plans that connect a company's existing software stack together.
Site: northsideintelligence.com/bridgeai.
Never mention Match Fit, Fitness Pros, or fitness-marketplace language — BridgeAI is a software-integration tool, not a fitness product.`,
};

export function getContentMachineBrandFacts(brandSlug: string): string | undefined {
  return CONTENT_MACHINE_BRAND_FACTS[brandSlug];
}

/**
 * Keyword pools countConcreteDetails() (quality-gate.ts) scores against, per brand. The old
 * code hardcoded a single Match Fit-only list (MF_FEATURES) and applied it to every brand's
 * caption, which is what made "at least 2 concrete details" only ever satisfiable by writing
 * about Match Fit. Each brand gets its own pool, grounded in CONTENT_MACHINE_BRAND_FACTS
 * above. Falsy/missing entry (unconfigured future brand) means countConcreteDetails() skips
 * the check rather than mis-failing every draft against an unrelated brand's vocabulary.
 */
export const CONTENT_MACHINE_FEATURE_KEYWORDS: Record<string, string[]> = {
  "match-fit": [
    "fithub",
    "fit hub",
    "promote token",
    "swipe",
    "background check",
    "founding",
    "beta",
    "verified",
    "match-fit.net",
    "independent pro",
    "vip",
    "discovery",
    "booking",
    "tier",
    "elite",
    "premium pro",
  ],
  ni: [
    "replyflow",
    "grantbot",
    "gapscan",
    "bridgeai",
    "signal desk",
    "smart store",
    "toolkit",
    "sector 3",
    "filling the gaps",
    "northside intelligence account",
    "northsideintelligence.com",
  ],
  "ni-store": [
    "smart store",
    "northsideintelligence.com/store",
    "kitchen",
    "tech",
    "home",
    "pets",
    "health",
    "beauty",
    "fitness",
    "auto",
    "entertainment",
    "smart home",
    "curated",
    "northside intelligence",
  ],
  grantbot: [
    "grant",
    "nonprofit",
    "funding",
    "grant application",
    "grantbot",
    "northsideintelligence.com/grantbot",
    "creator",
    "research",
    "small business",
    "arts",
  ],
  gapscan: [
    "gap",
    "workflow",
    "severity",
    "quick win",
    "gapscan",
    "northsideintelligence.com/gapscan",
    "onboarding",
    "critical gap",
  ],
  bridgeai: [
    "integration",
    "orchestration",
    "workflow",
    "software stack",
    "bridgeai",
    "northsideintelligence.com/bridgeai",
    "cross-platform",
    "api",
  ],
};
