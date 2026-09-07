import { randomUUID } from "node:crypto";
import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import {
  CONTENT_POST_TYPES,
  DEFAULT_BRAND_SLUG,
  getContentMachineBrandFacts,
  MAX_HASHTAGS,
  MAX_REGEN_ATTEMPTS,
  PLATFORMS_BY_TYPE,
} from "./constants";
import {
  findExistingDailyPost,
  insertPost,
  loadBrandProfile,
  loadFewShots,
  loadRecentLearnings,
  loadToneRules,
  logSignal,
} from "./db";
import { buildHighVolumeHashtagRule, enforceHighVolumeHashtags } from "./hashtag-policy";
import { buildMediaPrompt, queueContentMachineImageJob } from "./image-gen";
import { buildRegenFeedback, hasBannedPhrase, runQualityGate, stripBannedReferences } from "./quality-gate";
import type {
  ContentPost,
  ContentPostType,
  GeneratedDraft,
  GenerateSlotInput,
} from "./types";
import {
  buildSlotBrief,
  getDefaultThemeDayIndex,
  getThemeAudienceForPost,
  getWeekdayTheme,
} from "./weekday-themes";

/** Health Scan 2026-08-30: model output truncated mid-string (hit maxOutputTokens) was
 * reaching JSON.parse uncaught, killing the whole daily batch with "Unterminated string
 * in JSON at position N". Wrap it so a bad response is retried like any other gate
 * failure instead of taking the cron down. */
class ContentDraftParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentDraftParseError";
  }
}

function parseJsonResponse(text: string): GeneratedDraft {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  let parsed: Partial<GeneratedDraft>;
  try {
    parsed = JSON.parse(cleaned) as GeneratedDraft;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new ContentDraftParseError(
      `Model returned invalid JSON (${reason}) — ${cleaned.length} chars, likely truncated: "${cleaned.slice(-120)}"`
    );
  }
  return {
    caption: String(parsed.caption ?? "").trim(),
    visualPrompt:
      parsed.visualPrompt === null || parsed.visualPrompt === undefined
        ? null
        : String(parsed.visualPrompt).trim(),
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map((h) => String(h).trim()).filter(Boolean)
      : [],
  };
}

function buildSystemPrompt(args: {
  brandSlug: string;
  brandName: string;
  voiceRules: string[];
  bannedPhrases: string[];
  toneRules: string[];
  productFacts?: string;
  fewShot?: { caption: string; visual_prompt: string | null; hashtags: string[] };
  researchSnippet?: string;
}): string {
  const lines = [
    `You are Content Machine for ${args.brandName}. Output ONLY valid JSON.`,
    "",
    "Voice rules:",
    ...args.voiceRules.map((r) => `- ${r}`),
    "",
    "Banned phrases (never use):",
    ...args.bannedPhrases.map((p) => `- ${p}`),
  ];

  // BUILD fix 2026-09-07: this used to be silent — a brand with no product-facts block
  // had nothing grounding it but voice/tone, and the quality-requirements bullets below
  // used to hardcode Match Fit as if every brand were Match Fit. Real per-brand facts now
  // come from CONTENT_MACHINE_BRAND_FACTS (constants.ts); when a brand has none configured
  // yet, say so explicitly rather than letting the model invent or drift to another brand.
  lines.push(
    "",
    "Product facts (ground every concrete claim in these — never invent features or pricing, and never write about a different Northside product):",
    args.productFacts ?? `(No product facts configured yet for ${args.brandName} — stay generic and voice-only; do not invent features, and do not describe any other Northside product.)`
  );

  if (args.toneRules.length) {
    lines.push("", "Learned tone rules from operator edits:", ...args.toneRules.map((r) => `- ${r}`));
  }
  if (args.fewShot) {
    lines.push(
      "",
      "Approved example (match tone and substance, do not copy verbatim):",
      `Caption: ${args.fewShot.caption}`,
      args.fewShot.visual_prompt ? `Visual: ${args.fewShot.visual_prompt}` : "",
      `Hashtags: ${args.fewShot.hashtags.join(" ")}`
    );
  }
  if (args.researchSnippet) {
    lines.push("", "Industry research (use as inspiration, not verbatim copy):", args.researchSnippet);
  }

  const isMatchFit = args.brandSlug === "match-fit";

  lines.push(
    "",
    "Output schema:",
    `{"caption":"...","visualPrompt":"..." or null for Text,"hashtags":["#Tag1","#Tag2"]} — hashtags MUST come from the approved list below`,
    "",
    "Quality requirements:",
    "- Hook: first line must be a question, stat, or pattern interrupt",
    // "Fitness Pros" is Match Fit's own vocabulary — was previously forced onto every
    // brand's prompt regardless of product, which is the root cause every NI-family brand
    // batch wrote Match Fit copy. Only apply it when this brand IS Match Fit.
    isMatchFit ? '- Always say "Fitness Pros" — never trainers or personal trainers' : "",
    `- At least 2 concrete details about ${args.brandName} specifically (from the product facts above) — never another Northside product's name, feature, or promo`,
    "- Visual prompts: scene, subject, action, mood, on-screen text — NOT hex colors only",
    buildHighVolumeHashtagRule(args.brandSlug, MAX_HASHTAGS),
    "- Brand palette (#07080C dark, #FF7E00 orange) is accent only"
  );

  return lines.filter(Boolean).join("\n");
}

export async function generateSlotDraft(
  input: GenerateSlotInput,
  feedback?: string
): Promise<GeneratedDraft> {
  const profile = await loadBrandProfile(input.brandSlug);
  if (!profile) throw new Error(`Brand profile not found: ${input.brandSlug}`);

  const toneRules = await loadToneRules(input.brandSlug);
  const fewShotRaw = await loadFewShots({
    brandSlug: input.brandSlug,
    postType: input.postType,
    targetGroup: input.targetGroup,
  });
  const learningsRaw = input.researchSnippet
    ? [input.researchSnippet]
    : await loadRecentLearnings(2);

  // See stripBannedReferences() above: tone rules and learnings are correctly
  // brand-scoped by their own queries, but their TEXT can still cite another
  // Northside product by name. Drop any line that would leak this brand's own
  // banned phrase into its own prompt before it gets there. A few-shot example
  // that itself trips the brand's banned-phrase list is poisoned in full, not
  // salvageable line-by-line, so it's dropped entirely rather than edited.
  const safeToneRuleLines = stripBannedReferences(
    toneRules.map((r) => r.rule_text),
    profile.banned_phrases
  );
  const safeLearnings = stripBannedReferences(learningsRaw, profile.banned_phrases);
  const fewShot =
    fewShotRaw &&
    !hasBannedPhrase(fewShotRaw.caption, profile.banned_phrases) &&
    !hasBannedPhrase(fewShotRaw.visual_prompt ?? "", profile.banned_phrases)
      ? fewShotRaw
      : undefined;

  const system = buildSystemPrompt({
    brandSlug: input.brandSlug,
    brandName: profile.name,
    voiceRules: profile.voice_rules,
    bannedPhrases: profile.banned_phrases,
    toneRules: safeToneRuleLines,
    productFacts: getContentMachineBrandFacts(input.brandSlug),
    fewShot: fewShot ?? undefined,
    researchSnippet: safeLearnings.join("\n") || undefined,
  });

  const slotBrief = buildSlotBrief({
    dayIndex: input.dayIndex,
    postType: input.postType,
    targetGroup: input.targetGroup,
    brandSlug: input.brandSlug,
  });

  const userPrompt = [
    slotBrief,
    feedback ? `\n${feedback}` : "",
    "\nGenerate one post. Return JSON only.",
  ].join("");

  const { text } = await generateTextGeminiFirst({
    system,
    prompt: userPrompt,
    maxOutputTokens: 2000,
    jsonMode: true,
  });

  const draft = parseJsonResponse(text);
  if (input.postType === "Text") draft.visualPrompt = null;
  // JB's locked rule, enforced deterministically. The model drifts back to niche
  // and invented tags no matter how the prompt is worded, so coerce every draft
  // against the approved high-volume pool before it reaches the quality gate.
  draft.hashtags = enforceHighVolumeHashtags(input.brandSlug, draft.hashtags, MAX_HASHTAGS);
  return draft;
}

export async function generateSlotWithQualityGate(
  input: GenerateSlotInput
): Promise<{ draft: GeneratedDraft; attempts: number; failures: string[] }> {
  const profile = await loadBrandProfile(input.brandSlug);
  if (!profile) throw new Error(`Brand profile not found: ${input.brandSlug}`);

  let feedback: string | undefined;
  let lastFailures: string[] = [];
  let lastDraft: GeneratedDraft | undefined;
  // Sticky once true: even if a later attempt's OWN gate check doesn't hit a banned
  // phrase but still fails on something else, the batch must not silently insert
  // Match-Fit-poisoned copy just because the last-tried draft happened not to repeat
  // the exact banned string. See the hard-fail block below.
  let sawHardFail = false;

  for (let attempt = 1; attempt <= MAX_REGEN_ATTEMPTS + 1; attempt++) {
    let draft: GeneratedDraft;
    try {
      draft = await generateSlotDraft(input, feedback);
    } catch (err) {
      if (!(err instanceof ContentDraftParseError)) throw err;
      // On the final attempt this just falls out of the loop with lastDraft unset (if every
      // attempt failed to parse) or set to the last gate-failing-but-valid draft — same
      // best-effort-flagged fallback the post-loop block already uses for gate failures.
      lastFailures = [err.message];
      feedback = "Your last response was not valid JSON. Output ONLY the JSON object, nothing else.";
      await logSignal({
        brandSlug: input.brandSlug,
        signalType: "REGENERATED",
        meta: { failures: lastFailures, attempt, parseError: true, ...input },
      });
      continue;
    }
    const gate = runQualityGate({
      draft,
      postType: input.postType,
      bannedPhrases: profile.banned_phrases,
      brandSlug: input.brandSlug,
    });

    if (gate.pass) {
      return { draft, attempts: attempt, failures: [] };
    }

    lastFailures = gate.failures;
    lastDraft = draft;
    sawHardFail = sawHardFail || gate.hardFail;
    feedback = buildRegenFeedback(gate.failures, { brandName: profile.name });

    if (attempt <= MAX_REGEN_ATTEMPTS) {
      await logSignal({
        brandSlug: input.brandSlug,
        signalType: "REGENERATED",
        // Record the actual opening line — without it a repeated gate failure
        // is undiagnosable and the whole daily batch just dies silently.
        meta: {
          failures: gate.failures,
          attempt,
          firstLine: draft.caption.trim().split(/\n/)[0]?.slice(0, 160) ?? "",
          ...input,
        },
      });
    }
  }

  // BUILD fix 2026-09-07: a banned-phrase hit is a correctness bug (wrong-brand or
  // off-limits content), not a style nit — this used to fall through to the
  // "keep best draft, accept flagged" path below like any other gate failure, which is
  // exactly how 8 Match-Fit-branded posts got inserted for ni/ni-store/grantbot/gapscan/
  // bridgeai on 2026-09-07 despite each brand's banned_phrases containing "Match Fit".
  // Fail loud instead of inserting a mislabeled post — the caller (cron route) already
  // handles a thrown error from this function without killing the rest of the batch.
  if (sawHardFail) {
    throw new Error(
      `Quality gate hard-rejected ${input.brandSlug} ${input.postType}: banned phrase present ` +
        `after ${MAX_REGEN_ATTEMPTS + 1} attempts (${lastFailures.join("; ")}). Refusing to insert ` +
        `a mislabeled post — this needs a prompt/facts fix for this brand, not an approval click.`
    );
  }

  // Never kill the whole batch over a style rule. After the last retry, keep the
  // best draft and let it through flagged — JB approves every post by hand
  // anyway, so a caption he can fix beats no batch at all.
  if (lastDraft) {
    await logSignal({
      brandSlug: input.brandSlug,
      signalType: "REGENERATED",
      meta: {
        failures: lastFailures,
        attempt: MAX_REGEN_ATTEMPTS + 1,
        acceptedFlagged: true,
        firstLine: lastDraft.caption.trim().split(/\n/)[0]?.slice(0, 160) ?? "",
        ...input,
      },
    });
    return { draft: lastDraft, attempts: MAX_REGEN_ATTEMPTS + 1, failures: lastFailures };
  }

  throw new Error(
    `Quality gate failed after ${MAX_REGEN_ATTEMPTS + 1} attempts: ${lastFailures.join("; ")}`
  );
}

export async function generateDailyBatch(args?: {
  brandSlug?: string;
  dayIndex?: number;
  withImages?: boolean;
}): Promise<{ batchId: string; posts: ContentPost[]; failures: Array<{ postType: ContentPostType; error: string }> }> {
  const brandSlug = args?.brandSlug ?? DEFAULT_BRAND_SLUG;
  const dayIndex = args?.dayIndex ?? getDefaultThemeDayIndex();
  const theme = getWeekdayTheme(dayIndex, brandSlug);
  const batchId = randomUUID();
  const learnings = await loadRecentLearnings(3);
  const researchSnippet = learnings.join("\n");
  const posts: ContentPost[] = [];
  // BUILD fix 2026-09-07 (PR #220 council review, security+authority lens): this loop used
  // to call generateSlotWithQualityGate with no per-iteration try/catch, so a thrown error
  // for ONE post type (e.g. a hard-rejected banned-phrase draft, per the new hardFail gate
  // above) aborted the whole in-process loop and silently dropped every OTHER post type in
  // this brand's daily batch too -- a single bad slot took down the whole day's generation
  // for this full-batch path (used by the manual "regenerate whole day" admin action and
  // api/content-machine/generate). Catching per-slot means one hard rejection only costs
  // that one post type; the rest of the day's batch still generates and lands for approval.
  const failures: Array<{ postType: ContentPostType; error: string }> = [];

  for (const postType of CONTENT_POST_TYPES) {
    const targetGroup = getThemeAudienceForPost(dayIndex, postType, brandSlug);
    let draft: GeneratedDraft;
    try {
      ({ draft } = await generateSlotWithQualityGate({
        brandSlug,
        dayIndex,
        postType,
        targetGroup,
        researchSnippet,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[content-machine] slot failed, continuing rest of daily batch: brand=${brandSlug} postType=${postType}: ${message}`
      );
      failures.push({ postType, error: message });
      continue;
    }

    // Media is queued to the mini (see ./image-gen.ts), never generated via an
    // API call here. image_url starts null; the prompt is also stored on the
    // post's own meta so the UI can show a status without another fetch.
    const wantsMedia = Boolean(
      args?.withImages && postType !== "Text" && draft.visualPrompt
    );

    const post = await insertPost({
      brand_slug: brandSlug,
      status: "pending_approval",
      day_index: dayIndex,
      post_type: postType,
      target_group: targetGroup,
      theme_name: theme.name,
      caption: draft.caption,
      visual_prompt: draft.visualPrompt,
      hashtags: draft.hashtags,
      image_url: null,
      scheduled_at: null,
      published_at: null,
      platforms: PLATFORMS_BY_TYPE[postType],
      batch_id: batchId,
      source_post_id: null,
      meta: {
        generated_at: new Date().toISOString(),
        ...(wantsMedia && draft.visualPrompt
          ? {
              media_status: "pending_mini_chrome",
              media_prompt: buildMediaPrompt(draft.visualPrompt),
            }
          : {}),
      },
    });

    if (wantsMedia && draft.visualPrompt) {
      try {
        await queueContentMachineImageJob({ postId: post.id, brandSlug });
      } catch (err) {
        console.warn("[content-machine] image job queue failed:", err);
      }
    }

    posts.push(post);
  }

  return { batchId, posts, failures };
}

/**
 * CM7-D8-CHUNK (2026-08-31): one slot per call instead of the whole day per call.
 *
 * axon_cron_jobs.hermes-content-daily-batch was failing with Vercel's
 * FUNCTION_INVOCATION_TIMEOUT (504, last run 2026-08-30 11:08 UTC) because
 * generateDailyBatch ran all 4 post types sequentially inside one serverless
 * invocation with no chunking. That alone would be tight against maxDuration=300,
 * but the real compounding cause lives one layer down: every generateSlotDraft
 * call goes through generateTextGeminiFirst -> the router's local lane,
 * which polls the Mac-mini job queue for up to MINI_RELAY_MAX_WAIT_MS (45s) before
 * falling through to Gemini. With up to MAX_REGEN_ATTEMPTS+1=3 quality-gate
 * attempts per slot, 4 slots x up to 3 attempts x a 45s AXON-local stall alone is
 * 540s worst case -- comfortably past the 300s budget even before any Gemini
 * network time, independent of whether the mini happens to be reachable that
 * morning. Chunking to one slot per invocation bounds the worst case to a single
 * slot (~3 attempts x ~45-60s <= ~180s), safely under 300s regardless of whether
 * AXON-local answers or stalls out every time.
 *
 * Resumable by construction: checks findExistingDailyPost() before spending an
 * LLM call, so a partial-day rerun (hermes-rerun-failed.mjs re-invoking the same
 * trigger script) only regenerates the slot(s) that didn't land, and never
 * duplicates a slot that already did -- the content_machine_brand_guard trigger's
 * own week_start/day_index/post_type check-then-insert is the authoritative
 * backstop against a real duplicate row even if this precheck is stale.
 *
 * generateDailyBatch() above is left untouched (same signature, same full-loop
 * behavior) for its other existing callers (api/content-machine/generate manual
 * "regenerate whole day", the NI-brand cron) -- only the Match Fit daily-batch
 * cron path (route.ts) and its Hermes trigger script were changed to call this
 * once per post type.
 */
export async function generateBatchSlot(args: {
  brandSlug?: string;
  dayIndex?: number;
  postType: ContentPostType;
  withImages?: boolean;
  batchId?: string;
  researchSnippet?: string;
}): Promise<{ batchId: string; post: ContentPost | null; skipped: boolean }> {
  const brandSlug = args.brandSlug ?? DEFAULT_BRAND_SLUG;
  const dayIndex = args.dayIndex ?? getDefaultThemeDayIndex();
  const batchId = args.batchId ?? randomUUID();

  const alreadyGenerated = await findExistingDailyPost({
    brandSlug,
    dayIndex,
    postType: args.postType,
  });
  if (alreadyGenerated) {
    return { batchId, post: null, skipped: true };
  }

  const theme = getWeekdayTheme(dayIndex, brandSlug);
  const targetGroup = getThemeAudienceForPost(dayIndex, args.postType, brandSlug);
  const researchSnippet =
    args.researchSnippet ?? (await loadRecentLearnings(3)).join("\n");

  const { draft } = await generateSlotWithQualityGate({
    brandSlug,
    dayIndex,
    postType: args.postType,
    targetGroup,
    researchSnippet,
  });

  const wantsMedia = Boolean(
    args.withImages && args.postType !== "Text" && draft.visualPrompt
  );

  const post = await insertPost({
    brand_slug: brandSlug,
    status: "pending_approval",
    day_index: dayIndex,
    post_type: args.postType,
    target_group: targetGroup,
    theme_name: theme.name,
    caption: draft.caption,
    visual_prompt: draft.visualPrompt,
    hashtags: draft.hashtags,
    image_url: null,
    scheduled_at: null,
    published_at: null,
    platforms: PLATFORMS_BY_TYPE[args.postType],
    batch_id: batchId,
    source_post_id: null,
    meta: {
      generated_at: new Date().toISOString(),
      ...(wantsMedia && draft.visualPrompt
        ? {
            media_status: "pending_mini_chrome",
            media_prompt: buildMediaPrompt(draft.visualPrompt),
          }
        : {}),
    },
  });

  if (wantsMedia && draft.visualPrompt) {
    try {
      await queueContentMachineImageJob({ postId: post.id, brandSlug });
    } catch (err) {
      console.warn("[content-machine] image job queue failed:", err);
    }
  }

  return { batchId, post, skipped: false };
}
