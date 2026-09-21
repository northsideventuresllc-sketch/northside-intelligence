import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { queueContentMachineImageJob } from "@/lib/content-machine/image-gen";
import { setNiPostStatus } from "@/lib/content-machine/ni-content";

const SUPABASE_URL =
  process.env.NI_BRAIN_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kxijunwgbrlfzvgkhklo.supabase.co";

function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

/**
 * The ops session cookie is one shared secret with no per-person identity (same
 * constraint as src/lib/ops/morality.ts's resolveSoleActingSteward). There is no
 * reviewer table to resolve a real identity from here, so every decision is
 * attributed to this fixed label rather than trusting a client-supplied reviewer
 * name that any ops-session holder could spoof.
 */
export const REVIEWER_IDENTITY = "NI Portal Ops (shared session)";

export type ReviewArtifactStatus = "pending" | "approved" | "rejected" | "needs_changes";
export type ReviewArtifactDecision = Exclude<ReviewArtifactStatus, "pending">;

export type ReviewArtifact = {
  id: string;
  venture_id: string | null;
  created_by_agent: string | null;
  content_kind: string;
  title: string | null;
  draft_content: string | null;
  draft_ref: string | null;
  draft_format: string | null;
  platform: string | null;
  metadata: Record<string, unknown> | null;
  source_ref: string | null;
  status: ReviewArtifactStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
};

const ARTIFACT_FIELDS =
  "id,venture_id,created_by_agent,content_kind,title,draft_content,draft_ref,draft_format,platform,metadata,source_ref,status,reviewed_by,reviewed_at,reviewer_notes,created_at,updated_at";

export async function listReviewArtifacts(): Promise<ReviewArtifact[]> {
  const { data, error } = await serviceClient()
    .from("nvg_review_artifacts")
    .select(ARTIFACT_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function decideReviewArtifact(
  id: string,
  decision: ReviewArtifactDecision,
  reviewerNotes: string | null
): Promise<ReviewArtifact> {
  const client = serviceClient();
  const { data: existing, error: fetchError } = await client
    .from("nvg_review_artifacts")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error(`Artifact ${id} not found`);
  if (existing.status !== "pending") {
    throw new Error(`Artifact ${id} already decided (status=${existing.status})`);
  }

  const { data, error } = await client
    .from("nvg_review_artifacts")
    .update({
      status: decision,
      reviewed_by: REVIEWER_IDENTITY,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select(ARTIFACT_FIELDS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Artifact ${id} was decided by someone else just now — refresh and retry`);

  // nvg_review_artifacts_content_kind_check (live schema) only allows 'social_post' |
  // 'outreach_message' | 'other' — CONTENT's mirrored drafts use content_kind='social_post'
  // (see draftContentReviewArtifact in src/lib/content-machine/review-gate.ts), same as any
  // other social-post artifact. created_by_agent='CONTENT' is the precise discriminator for
  // "this row has a linked content_machine_posts row via source_ref" so approving some other
  // agent's unrelated social_post artifact never touches content_machine_posts.
  if (decision === "approved" && data.content_kind === "social_post" && data.created_by_agent === "CONTENT") {
    await applyContentApprovalSideEffects(data);
  }

  return data;
}

/**
 * Decision #1888 Phase 4 (BUILD-ARTIFACT-PIPELINE-CONTENT-INTEGRATION-0914-04):
 * CONTENT drafts land in nvg_review_artifacts (content_kind="social_post",
 * created_by_agent="CONTENT") mirrored alongside their live content_machine_posts row
 * (source_ref links the two — see draftContentReviewArtifact in
 * src/lib/content-machine/review-gate.ts). Approving
 * the artifact here must also carry that approval through to the linked
 * content_machine_posts row so the existing draft -> pending_approval -> approved
 * -> scheduled -> published state machine (schedule.ts) can proceed, and optionally
 * queue the Gemini Mac-mini generation job if the draft wanted media. Never fatal —
 * the artifact decision itself has already committed by the time this runs.
 */
async function applyContentApprovalSideEffects(artifact: ReviewArtifact): Promise<void> {
  if (!artifact.source_ref) return;

  try {
    await setNiPostStatus(artifact.source_ref, "approved");
  } catch (err) {
    console.warn("[ops/review-artifacts] failed to flip linked content_machine_posts row:", err);
  }

  const wantsMedia = Boolean((artifact.metadata as Record<string, unknown> | null)?.wants_media);
  if (wantsMedia && artifact.venture_id) {
    try {
      await queueContentMachineImageJob({ postId: artifact.source_ref, brandSlug: artifact.venture_id });
    } catch (err) {
      console.warn("[ops/review-artifacts] failed to queue mini image job on approval:", err);
    }
  }
}
