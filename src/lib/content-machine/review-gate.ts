import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { PLATFORMS_BY_TYPE } from "./constants";
import type { ContentPost, ContentPostType, ContentTargetGroup, GeneratedDraft } from "./types";

/**
 * Phase 4 of the Universal Operator Review Artifact Pipeline (Decision #1888,
 * BUILD-ARTIFACT-PIPELINE-CONTENT-INTEGRATION-0914-04).
 *
 * CONTENT still writes its draft to content_machine_posts via insertPost() (db.ts) —
 * the existing draft -> pending_approval -> approved -> scheduled -> published state
 * machine in schedule.ts, and everything downstream of it (scheduling, publishing),
 * still depends on that row existing. This module does NOT replace that path; it
 * mirrors a review-queue row alongside it so the same NI Portal Ops Artifact Review
 * surface (Phase 2, src/lib/ops/review-artifacts.ts) that already handles Outreach
 * artifacts can also review CONTENT drafts, without touching the live pipeline's
 * own state machine.
 *
 * Match Fit (Sector 1A) is explicitly out of scope for Decision #1888 — callers
 * must gate on brandSlug !== "match-fit" before calling draftContentReviewArtifact.
 */
export async function draftContentReviewArtifact(args: {
  brandSlug: string;
  themeName: string;
  postType: ContentPostType;
  dayIndex: number;
  batchId: string;
  targetGroup: ContentTargetGroup;
  draft: GeneratedDraft;
  wantsMedia: boolean;
  post: ContentPost;
  generatedAt: string;
}): Promise<void> {
  const sb = createServiceClient();

  const { error } = await sb.from("nvg_review_artifacts").insert({
    venture_id: args.brandSlug,
    created_by_agent: "CONTENT",
    // nvg_review_artifacts_content_kind_check only allows 'social_post' | 'outreach_message'
    // | 'other' (verified live against the Phase 1 schema, 2026-09-21) — CONTENT's
    // prompts/captions/hashtag drafts are social-media posts, so this maps to
    // 'social_post', matching how existing Outreach artifacts already use this column.
    content_kind: "social_post",
    title: `${args.themeName} — ${args.postType} (day ${args.dayIndex})`,
    draft_content: args.draft.caption,
    draft_format: "content_post",
    platform: (PLATFORMS_BY_TYPE[args.postType] ?? []).join(",") || null,
    source_ref: args.post.id,
    dedupe_key: `content:${args.brandSlug}:${args.dayIndex}:${args.postType}:${args.batchId}`,
    metadata: {
      post_type: args.postType,
      day_index: args.dayIndex,
      batch_id: args.batchId,
      target_group: args.targetGroup,
      theme_name: args.themeName,
      hashtags: args.draft.hashtags,
      visual_prompt: args.draft.visualPrompt ?? null,
      wants_media: args.wantsMedia,
      generated_at: args.generatedAt,
    },
  });

  if (error) throw new Error(error.message);
}
