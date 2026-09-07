/**
 * JB'S LOCKED HASHTAG RULE (ticket MF-HASHTAG-HIGHVOL, 2026-08-04)
 * ---------------------------------------------------------------
 * Use high-follower, already-popular hashtags ONLY.
 *   - No invented tags.
 *   - No low-volume long-tail tags.
 *   - No branded tags nobody searches.
 *
 * NI Social Craft Lock (Learnings 2499, 2026-07-28): ZERO brand tags on NI posts
 * until Northside has actual buzz. JB's own confirmed-working NI set is
 * #SmallBusiness #Sales #SalesTips #Entrepreneur #B2B — those lead the main NI pool.
 *
 * NOTE ON WHAT THIS REPLACED: `BANNED_HASHTAGS` in constants.ts used to ban
 * #FitnessMotivation, #GymLife, #FitFam, #NoPainNoGain and #MotivationMonday —
 * i.e. it banned the single highest-volume tags in the niche and pushed the model
 * toward niche long-tail tags. That was the direct cause of the weak tag sets JB
 * flagged. Those tags are approved again here.
 *
 * Every tag below is an established high-volume tag (millions+ of posts).
 * Do not add a tag unless it is already popular at that scale.
 *
 * BUILD fix 2026-09-07 (content-machine one-hashtag-pool-for-all-NI-brands bug):
 * every non-Match-Fit brand (ni, ni-store, grantbot, gapscan, bridgeai, replyflow,
 * signaldesk, ni-webdesign) shared ONE generic small-business pool via
 * `highVolumePoolForBrand()`'s `brandSlug === "match-fit" ? ... : NI_HIGH_VOLUME_HASHTAGS`
 * fallback. JB direct: "The hashtags need to be what pulls in the target audience for
 * that product. We can't have umbrella hashtags for all NI Portal offerings." Smart Store
 * (physical-goods ecommerce) was pulling #SmallBusiness/#B2B instead of shopping tags —
 * the wrong audience entirely. Each NI-family brand now gets its own pool grounded in
 * that product's actual buyer, mirroring the CONTENT_MACHINE_BRAND_FACTS /
 * CONTENT_MACHINE_FEATURE_KEYWORDS per-brand-map pattern already fixed in constants.ts
 * (PR #221). NI_HIGH_VOLUME_HASHTAGS stays as the fallback for a future brand slug that
 * hasn't been given its own pool yet — not as a shared default for known brands.
 */

/** High-volume fitness / coaching tags (match-fit). */
export const MATCH_FIT_HIGH_VOLUME_HASHTAGS = [
  "#Fitness",
  "#Workout",
  "#Gym",
  "#FitnessMotivation",
  "#GymLife",
  "#FitFam",
  "#PersonalTrainer",
  "#PersonalTraining",
  "#FitnessCoach",
  "#OnlineCoaching",
  "#Training",
  "#FitnessJourney",
  "#HealthyLifestyle",
  "#GymMotivation",
  "#StrengthTraining",
  "#Exercise",
  "#WeightLoss",
  "#Health",
  "#Transformation",
  "#Wellness",
] as const;

/**
 * Main NI brand ("ni") pool — audience is people looking for AI business tools /
 * the Sector 3 toolkit itself, not generic small-business owners. Also serves as the
 * fallback pool for any future brand slug that hasn't been given its own pool yet
 * (see `highVolumePoolForBrand()` below) — do not add a real, live brand slug here
 * and rely on the fallback; give it a real entry in `NI_FAMILY_HASHTAG_POOLS` instead.
 */
export const NI_HIGH_VOLUME_HASHTAGS = [
  "#AI",
  "#ArtificialIntelligence",
  "#AITools",
  "#MachineLearning",
  "#Automation",
  "#BusinessAutomation",
  "#SaaS",
  "#Tech",
  "#TechStartup",
  "#Innovation",
  "#DigitalTransformation",
  "#Productivity",
  "#Startup",
  "#B2B",
  "#SmallBusiness",
  "#Entrepreneur",
  "#FutureOfWork",
  "#Software",
  "#BusinessTools",
  "#TechNews",
] as const;

/** Smart Store — physical-goods ecommerce storefront. Audience shops, it doesn't buy AI tools. */
export const NI_STORE_HIGH_VOLUME_HASHTAGS = [
  "#ecommerce",
  "#onlineshopping",
  "#shopping",
  "#onlinestore",
  "#shopnow",
  "#shoponline",
  "#dealsoftheday",
  "#onlinedeals",
  "#giftideas",
  "#musthaves",
  "#newarrivals",
  "#trending",
  "#retailtherapy",
  "#instashop",
  "#shopsmall",
] as const;

/** Custom Web Design and Management — audience is businesses shopping for a website. */
export const NI_WEBDESIGN_HIGH_VOLUME_HASHTAGS = [
  "#WebDesign",
  "#WebDevelopment",
  "#WebsiteDesign",
  "#WebDesigner",
  "#UIUX",
  "#ResponsiveDesign",
  "#SmallBusinessWebsite",
  "#CustomWebsite",
  "#DigitalPresence",
  "#WebsiteBuilder",
  "#BrandIdentity",
  "#SiteDesign",
  "#WebDeveloper",
  "#DigitalMarketing",
  "#SmallBusiness",
] as const;

/** GrantBot — audience is nonprofits, grant writers, and mission-driven orgs chasing funding. */
export const GRANTBOT_HIGH_VOLUME_HASHTAGS = [
  "#Nonprofit",
  "#GrantWriting",
  "#Fundraising",
  "#Nonprofitlife",
  "#Philanthropy",
  "#SocialImpact",
  "#Grants",
  "#NPO",
  "#Charity",
  "#CommunityImpact",
  "#NonprofitOrganization",
  "#FundingOpportunities",
  "#CauseMarketing",
  "#GivingBack",
  "#ArtsFunding",
] as const;

/** GapScan — audience is product and operations people hunting for workflow gaps. */
export const GAPSCAN_HIGH_VOLUME_HASHTAGS = [
  "#ProductManagement",
  "#OperationsManagement",
  "#BusinessProcess",
  "#ProcessImprovement",
  "#ProductOps",
  "#Efficiency",
  "#Workflow",
  "#ContinuousImprovement",
  "#LeanSixSigma",
  "#BusinessOperations",
  "#ProductManager",
  "#BusinessStrategy",
  "#Startups",
  "#Automation",
  "#Ops",
] as const;

/** BridgeAI — audience is technical / integration buyers connecting existing software. */
export const BRIDGEAI_HIGH_VOLUME_HASHTAGS = [
  "#APIIntegration",
  "#SoftwareIntegration",
  "#DevOps",
  "#TechStack",
  "#CloudComputing",
  "#EnterpriseSoftware",
  "#SaaS",
  "#API",
  "#SystemIntegration",
  "#NoCode",
  "#CloudSoftware",
  "#TechSolutions",
  "#IT",
  "#B2BSoftware",
  "#Automation",
] as const;

/** ReplyFlow — audience is customer support / CX teams and small businesses managing reviews and DMs. */
export const REPLYFLOW_HIGH_VOLUME_HASHTAGS = [
  "#CustomerService",
  "#CustomerExperience",
  "#CustomerSupport",
  "#CX",
  "#SocialMediaManagement",
  "#CommunityManagement",
  "#ReputationManagement",
  "#OnlineReviews",
  "#CustomerEngagement",
  "#SupportTeam",
  "#SmallBusiness",
  "#BusinessAutomation",
  "#DigitalMarketing",
  "#Chatbot",
  "#CustomerSuccess",
] as const;

/** Signal Desk — audience is business intelligence / market research / analytics people. */
export const SIGNALDESK_HIGH_VOLUME_HASHTAGS = [
  "#BusinessIntelligence",
  "#DataAnalytics",
  "#MarketResearch",
  "#DataDriven",
  "#Analytics",
  "#BigData",
  "#CompetitiveIntelligence",
  "#DataScience",
  "#BusinessInsights",
  "#MarketIntelligence",
  "#DataStrategy",
  "#BusinessAnalytics",
  "#Insights",
  "#DecisionMaking",
  "#TrendWatching",
] as const;

/**
 * Per-brand pool map for every NI-family brand slug (`content_machine_brand_profiles.slug`).
 * Each pool matches what that product's real buyer actually searches — not a shared
 * umbrella pool. Add a new brand's real pool here; do not route it through the generic
 * `NI_HIGH_VOLUME_HASHTAGS` fallback on purpose.
 */
const NI_FAMILY_HASHTAG_POOLS: Record<string, readonly string[]> = {
  ni: NI_HIGH_VOLUME_HASHTAGS,
  "ni-store": NI_STORE_HIGH_VOLUME_HASHTAGS,
  "ni-webdesign": NI_WEBDESIGN_HIGH_VOLUME_HASHTAGS,
  grantbot: GRANTBOT_HIGH_VOLUME_HASHTAGS,
  gapscan: GAPSCAN_HIGH_VOLUME_HASHTAGS,
  bridgeai: BRIDGEAI_HIGH_VOLUME_HASHTAGS,
  replyflow: REPLYFLOW_HIGH_VOLUME_HASHTAGS,
  signaldesk: SIGNALDESK_HIGH_VOLUME_HASHTAGS,
};

/**
 * The approved pool for a brand slug. `match-fit` gets its fitness pool; every known
 * NI-family brand gets its own audience-specific pool from `NI_FAMILY_HASHTAG_POOLS`;
 * a genuinely unknown/future slug falls back to the main NI pool rather than erroring.
 */
export function highVolumePoolForBrand(brandSlug: string): readonly string[] {
  if (brandSlug === "match-fit") return MATCH_FIT_HIGH_VOLUME_HASHTAGS;
  return NI_FAMILY_HASHTAG_POOLS[brandSlug] ?? NI_HIGH_VOLUME_HASHTAGS;
}

function bareTag(raw: string): string {
  return String(raw).replace(/^#/, "").trim().toLowerCase();
}

/** True when `tag` is on the approved high-volume list for that brand. */
export function isHighVolumeHashtag(brandSlug: string, tag: string): boolean {
  const approved = new Set(highVolumePoolForBrand(brandSlug).map(bareTag));
  return approved.has(bareTag(tag));
}

/**
 * Deterministically coerces model output to JB's locked rule: drop anything off
 * the approved pool (invented, long-tail, dead branded tags), then backfill from
 * the pool so a post never ships short. Prompting alone drifts, so this runs on
 * every generation.
 */
export function enforceHighVolumeHashtags(
  brandSlug: string,
  tags: string[] | null | undefined,
  max = 5
): string[] {
  const pool = highVolumePoolForBrand(brandSlug);
  const canonical = new Map(pool.map((t) => [bareTag(t), t]));
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of tags ?? []) {
    const key = bareTag(raw);
    const hit = canonical.get(key);
    if (!hit || seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
    if (out.length >= max) return out;
  }

  for (const tag of pool) {
    if (out.length >= max) break;
    const key = bareTag(tag);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }

  return out;
}

/** Prompt text stating the locked rule, with the brand's approved pool inlined. */
export function buildHighVolumeHashtagRule(brandSlug: string, max = 5): string {
  return [
    "HASHTAG RULE (LOCKED — no exceptions):",
    "- Use high-follower, already-popular hashtags ONLY. Every tag must already be a large, actively-searched tag on the platform.",
    "- Never invent a hashtag.",
    "- Never use low-volume long-tail tags (a multi-word phrase nobody searches is not a hashtag).",
    "- Never use branded tags nobody searches. The brand name belongs in the caption, not the hashtags.",
    `- Use at most ${max} hashtags, chosen ONLY from this approved high-volume list:`,
    `  ${highVolumePoolForBrand(brandSlug).join(" ")}`,
    "- Tags outside that list are discarded automatically, so picking one just wastes a slot.",
  ].join("\n");
}
