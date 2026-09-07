import { isHighVolumeHashtag } from "./hashtag-policy";
import {
  BANNED_HASHTAGS,
  CONTENT_MACHINE_FEATURE_KEYWORDS,
  DEFAULT_BRAND_SLUG,
  MAX_HASHTAGS,
  MIN_CONCRETE_DETAILS,
  MIN_VISUAL_PROMPT_CHARS,
} from "./constants";
import type { ContentPostType, GeneratedDraft, QualityGateResult } from "./types";

/** Exported so generator.ts can identify a banned-phrase hit by exact string match
 * without re-implementing the check — a banned phrase is a hard reject (see
 * generateSlotWithQualityGate), never the "accept flagged after N attempts" path. */
export const BANNED_PHRASE_FAILURE = "Contains banned phrase";

const LAZY_CAPTION_RE =
  /^(?:◈|▣|▶|≡)?\s*(?:Carousel|Static|Video|Text)\s*(?:#\d+\s*)?for\s+(?:Join the Team|List With Us|Clients)\s*[—–-]\s*Match Fit/i;

const LAZY_VISUAL_RE =
  /^Dark\s+#07080C(?:,\s*|\s+)orange\s+#FF7E00\.?\s*(?:◈|▣|▶|≡)?\s*(?:Carousel|Static|Video|Text)\s*for/i;

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

/**
 * BUILD fix 2026-09-07: this used to score every brand's caption against a single
 * hardcoded Match Fit vocabulary list (MF_FEATURES), which meant "at least 2 concrete
 * details" was only ever satisfiable by writing about Match Fit — the direct cause of
 * every NI-family brand's content-machine batch drifting into Match Fit copy. Now scores
 * against CONTENT_MACHINE_FEATURE_KEYWORDS[brandSlug]. A brand with no configured keyword
 * pool returns MIN_CONCRETE_DETAILS (i.e. this specific check is skipped, not mis-failed
 * against an unrelated brand's vocabulary) rather than silently falling back to Match Fit's.
 */
export function countConcreteDetails(caption: string, brandSlug: string = DEFAULT_BRAND_SLUG): number {
  const keywords = CONTENT_MACHINE_FEATURE_KEYWORDS[brandSlug];
  if (!keywords) return MIN_CONCRETE_DETAILS;
  const lower = caption.toLowerCase();
  return keywords.filter((f) => lower.includes(f)).length;
}

export function hasBannedPhrase(caption: string, bannedPhrases: string[]): boolean {
  const lower = caption.toLowerCase();
  return bannedPhrases.some((phrase) => lower.includes(phrase.toLowerCase()));
}

/**
 * BUILD fix 2026-09-07 (content-machine wrong-brand bug, ROOT CAUSE — verified against
 * live data, not guessed): confirmed via content_machine_signals that ni/ni-store/
 * grantbot/gapscan's very FIRST generation attempt (2026-09-07 16:47-16:54 UTC, before
 * any regen feedback existed) already tripped the banned-phrase gate. PR #220 fixed the
 * product-facts block, but content_machine_tone_rules — correctly brand-scoped by its own
 * query (loadToneRules filters on brand_slug) — has rows shared verbatim across every
 * NI-family brand that cite "Match Fit" and "match-fit.net" by name as illustrative/
 * historical examples (e.g. a logo-domain formatting rule using match-fit.net as its
 * example, "the 2026-08-25 Match Fit Static image was unusable..."). That text reaches
 * every one of these brands' system prompt as "Learned tone rules from operator edits"
 * and is exactly what the model picks up and echoes back, tripping this brand's own
 * banned_phrases check. (Ruled out loadRecentLearnings as the trigger for THIS incident:
 * queried what it actually returned at the failure timestamp — no "Match Fit" in it. Still
 * a real risk given how often engineering Learnings mention other ventures by name, so
 * it's sanitized here too, not just tone rules.)
 *
 * generateSlotDraft() (generator.ts) applies this as a single choke point so any context
 * pulled from a shared/live-editable source (tone rules, few-shot examples, research
 * learnings) gets the same treatment before it ever reaches the prompt — not just today's
 * two known-bad tone-rule rows (which are also fixed at the data layer; see the NI-Brain
 * write-back for this session). Lives here rather than generator.ts because it's a pure
 * text filter with no server-only imports — generator.ts pulls in gemini-first.ts (which
 * imports the `server-only` package), which breaks this file's own plain-tsx regression
 * test (scripts/test-content-machine-brand-fix.ts) if it has to import through generator.ts.
 *
 * Deliberately NOT reusing hasBannedPhrase()'s exact-substring matching here: the real
 * contaminated tone-rule text names the domain "match-fit.net" (hyphen), which does not
 * contain the literal banned phrase "Match Fit" (space) as a substring — hasBannedPhrase()
 * correctly leaves it alone for that reason when it's gating a genuinely finished CAPTION
 * (it must stay exact there — that's what the existing round-1/round-2 regression tests
 * below pin down). But an injected CONTEXT line naming a competitor's exact domain is its
 * own contamination risk independent of the caption gate — a model that echoes
 * "match-fit.net" verbatim into a GrantBot caption would be promoting the wrong product's
 * domain without ever tripping the "Match Fit" (space) banned-phrase check at all. So this
 * filter normalizes -, _, and . to spaces before matching, on both sides, catching
 * "match-fit.net" against "Match Fit" without changing hasBannedPhrase()'s own semantics.
 */
function normalizeForContextMatch(text: string): string {
  return text.toLowerCase().replace(/[-_.]/g, " ");
}

export function stripBannedReferences(lines: string[], bannedPhrases: string[]): string[] {
  if (!bannedPhrases.length) return lines;
  const normalizedPhrases = bannedPhrases.map(normalizeForContextMatch).filter(Boolean);
  return lines.filter((line) => {
    if (!line.trim()) return false;
    const normalizedLine = normalizeForContextMatch(line);
    return !normalizedPhrases.some((phrase) => normalizedLine.includes(phrase));
  });
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
  const brandSlug = args.brandSlug ?? DEFAULT_BRAND_SLUG;

  if (isLazyCaption(draft.caption)) {
    failures.push("Lazy or placeholder caption");
  }
  // Hard-fail signal: a banned phrase is a correctness bug (wrong-brand/off-limits
  // content), not a style nit — generateSlotWithQualityGate must never let this fall
  // through to the "accept best draft flagged" fallback. See BANNED_PHRASE_FAILURE.
  const bannedPhraseHit = hasBannedPhrase(draft.caption, bannedPhrases);
  if (bannedPhraseHit) {
    failures.push(BANNED_PHRASE_FAILURE);
  }
  if (hasInventedPerson(draft.caption)) {
    failures.push("No invented people or made-up testimonials — only real, verifiable examples");
  }
  if (!hasValidHook(draft.caption)) {
    failures.push("Hook must be question, stat, or pattern interrupt");
  }
  if (countConcreteDetails(draft.caption, brandSlug) < MIN_CONCRETE_DETAILS) {
    failures.push(`Need at least ${MIN_CONCRETE_DETAILS} concrete details about this specific product`);
  }
  if (postType !== "Text" && isLazyVisual(draft.visualPrompt, postType)) {
    failures.push("Visual prompt too short or lazy (hex-only)");
  }
  failures.push(...validateHashtags(draft.hashtags, brandSlug));

  return { pass: failures.length === 0, failures, hardFail: bannedPhraseHit };
}

/**
 * BUILD fix 2026-09-07 (content-machine wrong-brand bug, root-cause round 2): this
 * hardcoded "concrete Match Fit feature/promo" into the regen-retry instructions for
 * EVERY brand, not just match-fit. It wasn't the trigger for the 2026-09-07 16:47-16:54
 * UTC incident (that was contaminated tone-rule text, fixed separately — see
 * stripBannedReferences() in generator.ts and the same-date NI-Brain data fix), because
 * attempt 1 was already failing on the banned phrase before any feedback existed. But it
 * actively made every subsequent regen attempt worse for every non-match-fit brand by
 * telling the model, in so many words, to go write about Match Fit. Now takes the
 * brand's own name and never names Match Fit for a brand that isn't it.
 */
export function buildRegenFeedback(failures: string[], args?: { brandName?: string }): string {
  const brandName = args?.brandName?.trim() || "this product";
  return [
    "QUALITY GATE FAILED — regenerate with these fixes:",
    ...failures.map((f) => `- ${f}`),
    `- Use a specific hook, a concrete ${brandName} feature/promo (from the product facts above — never another Northside product's name or feature), and scene-rich visual direction.`,
    "- The FIRST LINE must be one of: a question ending in '?', a number or stat, or a pattern interrupt opening with a word like Stop / Never / Nobody / Tired of / You / Here's / The truth. Do not open with a flat statement.",
  ].join("\n");
}
