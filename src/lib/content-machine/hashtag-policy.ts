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
 * #SmallBusiness #Sales #SalesTips #Entrepreneur #B2B — those lead the NI pool.
 *
 * Content Machine serves two brands, so the approved pool is per-brand:
 * fitness/coaching for match-fit, small-business/sales for ni.
 *
 * NOTE ON WHAT THIS REPLACED: `BANNED_HASHTAGS` in constants.ts used to ban
 * #FitnessMotivation, #GymLife, #FitFam, #NoPainNoGain and #MotivationMonday —
 * i.e. it banned the single highest-volume tags in the niche and pushed the model
 * toward niche long-tail tags. That was the direct cause of the weak tag sets JB
 * flagged. Those tags are approved again here.
 *
 * Every tag below is an established high-volume tag (millions+ of posts).
 * Do not add a tag unless it is already popular at that scale.
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

/** High-volume small-business / sales tags (ni). */
export const NI_HIGH_VOLUME_HASHTAGS = [
  "#SmallBusiness",
  "#Entrepreneur",
  "#Business",
  "#Marketing",
  "#Sales",
  "#SalesTips",
  "#SmallBusinessOwner",
  "#BusinessOwner",
  "#Entrepreneurship",
  "#DigitalMarketing",
  "#Startup",
  "#BusinessTips",
  "#Leadership",
  "#SocialMediaMarketing",
  "#Branding",
  "#Success",
  "#Mindset",
  "#Motivation",
  "#B2B",
  "#Networking",
  "#SmallBiz",
] as const;

/** The approved pool for a brand slug. Unknown slugs fall back to the NI pool. */
export function highVolumePoolForBrand(brandSlug: string): readonly string[] {
  return brandSlug === "match-fit"
    ? MATCH_FIT_HIGH_VOLUME_HASHTAGS
    : NI_HIGH_VOLUME_HASHTAGS;
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
