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

export const BANNED_HASHTAGS = [
  "#FitnessMotivation",
  "#GymLife",
  "#FitFam",
  "#NoPainNoGain",
  "#MotivationMonday",
];

export const DEFAULT_BRAND_SLUG = "match-fit";

export const MAX_REGEN_ATTEMPTS = 2;
export const MAX_HASHTAGS = 5;
export const MIN_VISUAL_PROMPT_CHARS = 80;
export const MIN_CONCRETE_DETAILS = 2;
