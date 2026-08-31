import { randomUUID } from "node:crypto";
import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import {
  CONTENT_POST_TYPES,
  DEFAULT_BRAND_SLUG,
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
import { generatePostImage } from "./image-gen";
import { buildRegenFeedback, runQualityGate } from "./quality-gate";
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

const MODEL = "anthropic/claude-haiku-4.5";

function parseJsonResponse(text: string): GeneratedDraft {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as GeneratedDraft;
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

  lines.push(
    "",
    "Output schema:",
    `{"caption":"...","visualPrompt":"..." or null for Text,"hashtags":["#Tag1","#Tag2"]} — hashtags MUST come from the approved list below`,
    "",
    "Quality requirements:",
    "- Hook: first line must be a question, stat, or pattern interrupt",
    '- Always say "Fitness Pros" — never trainers or personal trainers',
    "- At least 2 concrete Match Fit features, promos, or outcomes",
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
  const fewShot = await loadFewShots({
    brandSlug: input.brandSlug,
    postType: input.postType,
    targetGroup: input.targetGroup,
  });
  const learnings = input.researchSnippet
    ? [input.researchSnippet]
    : await loadRecentLearnings(2);

  const system = buildSystemPrompt({
    brandSlug: input.brandSlug,
    brandName: profile.name,
    voiceRules: profile.voice_rules,
    bannedPhrases: profile.banned_phrases,
    toneRules: toneRules.map((r) => r.rule_text),
    fewShot: fewShot ?? undefined,
    researchSnippet: learnings.join("\n") || undefined,
  });

  const slotBrief = buildSlotBrief({
    dayIndex: input.dayIndex,
    postType: input.postType,
    targetGroup: input.targetGroup,
  });

  const userPrompt = [
    slotBrief,
    feedback ? `\n${feedback}` : "",
    "\nGenerate one post. Return JSON only.",
  ].join("");

  const { text } = await generateTextGeminiFirst({
    anthropicModel: MODEL,
    system,
    prompt: userPrompt,
    maxOutputTokens: 1200,
    temperature: 0.7,
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

  for (let attempt = 1; attempt <= MAX_REGEN_ATTEMPTS + 1; attempt++) {
    const draft = await generateSlotDraft(input, feedback);
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
    feedback = buildRegenFeedback(gate.failures);

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
}): Promise<{ batchId: string; posts: ContentPost[] }> {
  const brandSlug = args?.brandSlug ?? DEFAULT_BRAND_SLUG;
  const dayIndex = args?.dayIndex ?? getDefaultThemeDayIndex();
  const theme = getWeekdayTheme(dayIndex);
  const batchId = randomUUID();
  const learnings = await loadRecentLearnings(3);
  const researchSnippet = learnings.join("\n");
  const posts: ContentPost[] = [];

  for (const postType of CONTENT_POST_TYPES) {
    const targetGroup = getThemeAudienceForPost(dayIndex, postType);
    const { draft } = await generateSlotWithQualityGate({
      brandSlug,
      dayIndex,
      postType,
      targetGroup,
      researchSnippet,
    });

    let imageUrl: string | null = null;
    if (args?.withImages && postType !== "Text" && draft.visualPrompt) {
      try {
        imageUrl = await generatePostImage({
          visualPrompt: draft.visualPrompt,
          brandSlug,
        });
      } catch (err) {
        console.warn("[content-machine] image gen failed:", err);
      }
    }

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
      image_url: imageUrl,
      scheduled_at: null,
      published_at: null,
      platforms: PLATFORMS_BY_TYPE[postType],
      batch_id: batchId,
      source_post_id: null,
      meta: { generated_at: new Date().toISOString() },
    });

    posts.push(post);
  }

  return { batchId, posts };
}

/**
 * CM7-D8-CHUNK (2026-08-31): one slot per call instead of the whole day per call.
 *
 * axon_cron_jobs.hermes-content-daily-batch was failing with Vercel's
 * FUNCTION_INVOCATION_TIMEOUT (504, last run 2026-08-30 11:08 UTC) because
 * generateDailyBatch ran all 4 post types sequentially inside one serverless
 * invocation with no chunking. That alone would be tight against maxDuration=300,
 * but the real compounding cause lives one layer down: every generateSlotDraft
 * call goes through generateTextGeminiFirst -> callAxonLocal (axon-local-relay.ts),
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

  const theme = getWeekdayTheme(dayIndex);
  const targetGroup = getThemeAudienceForPost(dayIndex, args.postType);
  const researchSnippet =
    args.researchSnippet ?? (await loadRecentLearnings(3)).join("\n");

  const { draft } = await generateSlotWithQualityGate({
    brandSlug,
    dayIndex,
    postType: args.postType,
    targetGroup,
    researchSnippet,
  });

  let imageUrl: string | null = null;
  if (args.withImages && args.postType !== "Text" && draft.visualPrompt) {
    try {
      imageUrl = await generatePostImage({
        visualPrompt: draft.visualPrompt,
        brandSlug,
      });
    } catch (err) {
      console.warn("[content-machine] image gen failed:", err);
    }
  }

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
    image_url: imageUrl,
    scheduled_at: null,
    published_at: null,
    platforms: PLATFORMS_BY_TYPE[args.postType],
    batch_id: batchId,
    source_post_id: null,
    meta: { generated_at: new Date().toISOString() },
  });

  return { batchId, post, skipped: false };
}
