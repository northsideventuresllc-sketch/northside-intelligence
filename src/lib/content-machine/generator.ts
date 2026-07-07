import { generateText } from "ai";
import { randomUUID } from "node:crypto";
import {
  CONTENT_POST_TYPES,
  DEFAULT_BRAND_SLUG,
  MAX_REGEN_ATTEMPTS,
  PLATFORMS_BY_TYPE,
} from "./constants";
import {
  insertPost,
  loadBrandProfile,
  loadFewShots,
  loadRecentLearnings,
  loadToneRules,
  logSignal,
} from "./db";
import { generatePostImage } from "./image-gen";
import { buildRegenFeedback, runQualityGate } from "./quality-gate";
import type { ContentPost, GeneratedDraft, GenerateSlotInput } from "./types";
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
    '{"caption":"...","visualPrompt":"..." or null for Text,"hashtags":["#tag1","#tag2"]}',
    "",
    "Quality requirements:",
    "- Hook: first line must be a question, stat, or pattern interrupt",
    '- Always say "Fitness Pros" — never trainers or personal trainers',
    "- At least 2 concrete Match Fit features, promos, or outcomes",
    "- Visual prompts: scene, subject, action, mood, on-screen text — NOT hex colors only",
    "- Max 5 hashtags, no generic spam tags",
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

  const { text } = await generateText({
    model: MODEL,
    system,
    prompt: userPrompt,
    maxOutputTokens: 1200,
    temperature: 0.7,
  });

  const draft = parseJsonResponse(text);
  if (input.postType === "Text") draft.visualPrompt = null;
  return draft;
}

export async function generateSlotWithQualityGate(
  input: GenerateSlotInput
): Promise<{ draft: GeneratedDraft; attempts: number; failures: string[] }> {
  const profile = await loadBrandProfile(input.brandSlug);
  if (!profile) throw new Error(`Brand profile not found: ${input.brandSlug}`);

  let feedback: string | undefined;
  let lastFailures: string[] = [];

  for (let attempt = 1; attempt <= MAX_REGEN_ATTEMPTS + 1; attempt++) {
    const draft = await generateSlotDraft(input, feedback);
    const gate = runQualityGate({
      draft,
      postType: input.postType,
      bannedPhrases: profile.banned_phrases,
    });

    if (gate.pass) {
      return { draft, attempts: attempt, failures: [] };
    }

    lastFailures = gate.failures;
    feedback = buildRegenFeedback(gate.failures);

    if (attempt <= MAX_REGEN_ATTEMPTS) {
      await logSignal({
        brandSlug: input.brandSlug,
        signalType: "REGENERATED",
        meta: { failures: gate.failures, attempt, ...input },
      });
    }
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
