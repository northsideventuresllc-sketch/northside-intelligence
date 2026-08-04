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
export const MAX_HASHTAGS = 5;
export const MIN_VISUAL_PROMPT_CHARS = 80;
export const MIN_CONCRETE_DETAILS = 2;
