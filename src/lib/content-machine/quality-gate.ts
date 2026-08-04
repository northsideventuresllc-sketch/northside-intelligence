import { isHighVolumeHashtag } from "./hashtag-policy";
import {
  BANNED_HASHTAGS,
  DEFAULT_BRAND_SLUG,
  MAX_HASHTAGS,
  MIN_CONCRETE_DETAILS,
  MIN_VISUAL_PROMPT_CHARS,
} from "./constants";
import type { ContentPostType, GeneratedDraft, QualityGateResult } from "./types";

const LAZY_CAPTION_RE =
  /^(?:◈|▣|▶|≡)?\s*(?:Carousel|Static|Video|Text)\s*(?:#\d+\s*)?for\s+(?:Join the Team|List With Us|Clients)\s*[—–-]\s*Match Fit/i;

const LAZY_VISUAL_RE =
  /^Dark\s+#07080C(?:,\s*|\s+)orange\s+#FF7E00\.?\s*(?:◈|▣|▶|≡)?\s*(?:Carousel|Static|Video|Text)\s*for/i;

const MF_FEATURES = [
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
];

/**
 * A valid hook is a question, a stat, or a pattern interrupt. The original list
 * only matched a handful of opening words, so real pattern interrupts ("Tired
 * of...", "You don't need...", "Nobody tells you...") were rejected and the
 * daily batch died after 3 regeneration attempts. Widened to the forms that are
 * actually hooks, still rejecting a flat declarative opener.
 */
const HOOK_PATTERNS = [
  /^\?/,
  /\?\s*$/, // whole first line is a question
  /^(?:what|why|how|when|where|who|which|did you|do you|can you|are you|is it|should you)/i,
  /^(?:stop|start|ever|most|only|never|forget|imagine|picture|listen|read that again)/i,
  /^\d+[%x]?\b/, // opens on a number or stat
  /^(?:here's|here is|the truth|truth is|myth|secret|nobody|no one|everyone|hot take|unpopular)/i,
  /^(?:you|your|if you|tired of|sick of|stuck|nobody tells you|it's not)/i,
];

/**
 * Invented people. The first live free-tier batch produced "Meet Sarah, one of
 * our founding Fitness Pros" — a fabricated testimonial about a customer who
 * does not exist. That is a trust and advertising problem, not a style nit, so
 * it is a hard gate failure.
 */
const FAKE_PERSON_RE =
  /\b(?:meet|introducing|say hello to|shoutout to|meet our)\s+[A-Z][a-z]{2,}\b|\b[A-Z][a-z]{2,},?\s+(?:one of our|a founding|our founding)\b/;

export function hasInventedPerson(caption: string): boolean {
  return FAKE_PERSON_RE.test(caption);
}

export function isLazyCaption(caption: string): boolean {
  const trimmed = caption.trim();
  if (!trimmed) return true;
  if (/^Could not generate /i.test(trimmed)) return true;
  if (/^Regenerate /i.test(trimmed)) return true;
  if (LAZY_CAPTION_RE.test(trimmed)) return true;
  if (/Match Fit beta\.?\s*match-fit\.net\s*$/i.test(trimmed) && trimmed.length < 120) {
    return true;
  }
  return false;
}

export function isLazyVisual(
  visualPrompt: string | null | undefined,
  postType: ContentPostType
): boolean {
  if (postType === "Text") return false;
  const trimmed = (visualPrompt ?? "").trim();
  if (!trimmed) return true;
  if (LAZY_VISUAL_RE.test(trimmed)) return true;
  if (/^Regenerate /i.test(trimmed)) return true;
  if (trimmed.length < MIN_VISUAL_PROMPT_CHARS) return true;
  return false;
}

export function hasValidHook(caption: string): boolean {
  const firstLine = caption.trim().split(/\n/)[0]?.trim() ?? "";
  return HOOK_PATTERNS.some((re) => re.test(firstLine));
}

export function countConcreteDetails(caption: string): number {
  const lower = caption.toLowerCase();
  return MF_FEATURES.filter((f) => lower.includes(f)).length;
}

export function hasBannedPhrase(caption: string, bannedPhrases: string[]): boolean {
  const lower = caption.toLowerCase();
  return bannedPhrases.some((phrase) => lower.includes(phrase.toLowerCase()));
}

export function validateHashtags(hashtags: string[], brandSlug = DEFAULT_BRAND_SLUG): string[] {
  const failures: string[] = [];
  if (hashtags.length > MAX_HASHTAGS) {
    failures.push(`Too many hashtags (${hashtags.length} > ${MAX_HASHTAGS})`);
  }
  for (const tag of hashtags) {
    if (BANNED_HASHTAGS.some((b) => b.toLowerCase() === tag.toLowerCase())) {
      failures.push(`Banned hashtag: ${tag}`);
    }
    // JB's locked rule: high-follower, already-popular tags only. The generator
    // coerces before this runs, so a failure here means a path skipped coercion.
    if (!isHighVolumeHashtag(brandSlug, tag)) {
      failures.push(`Not a high-volume hashtag (invented/long-tail/branded): ${tag}`);
    }
  }
  return failures;
}

export function runQualityGate(args: {
  draft: GeneratedDraft;
  postType: ContentPostType;
  bannedPhrases: string[];
  brandSlug?: string;
}): QualityGateResult {
  const failures: string[] = [];
  const { draft, postType, bannedPhrases } = args;

  if (isLazyCaption(draft.caption)) {
    failures.push("Lazy or placeholder caption");
  }
  if (hasBannedPhrase(draft.caption, bannedPhrases)) {
    failures.push("Contains banned phrase");
  }
  if (hasInventedPerson(draft.caption)) {
    failures.push("No invented people or made-up testimonials — only real, verifiable examples");
  }
  if (!hasValidHook(draft.caption)) {
    failures.push("Hook must be question, stat, or pattern interrupt");
  }
  if (countConcreteDetails(draft.caption) < MIN_CONCRETE_DETAILS) {
    failures.push(`Need at least ${MIN_CONCRETE_DETAILS} concrete Match Fit details`);
  }
  if (postType !== "Text" && isLazyVisual(draft.visualPrompt, postType)) {
    failures.push("Visual prompt too short or lazy (hex-only)");
  }
  failures.push(...validateHashtags(draft.hashtags, args.brandSlug ?? DEFAULT_BRAND_SLUG));

  return { pass: failures.length === 0, failures };
}

export function buildRegenFeedback(failures: string[]): string {
  return [
    "QUALITY GATE FAILED — regenerate with these fixes:",
    ...failures.map((f) => `- ${f}`),
    "- Use a specific hook, concrete Match Fit feature/promo, and scene-rich visual direction.",
    "- The FIRST LINE must be one of: a question ending in '?', a number or stat, or a pattern interrupt opening with a word like Stop / Never / Nobody / Tired of / You / Here's / The truth. Do not open with a flat statement.",
  ].join("\n");
}
