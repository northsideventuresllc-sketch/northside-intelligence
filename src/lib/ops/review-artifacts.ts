import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { queueContentMachineImageJob } from "@/lib/content-machine/image-gen";
import { setNiPostStatus } from "@/lib/content-machine/ni-content";
import { fetchLeadById, getClient as getAxonClient, updateLeadStatus } from "@/lib/axon/leads";
import { loadConfig } from "@/lib/axon/config.mjs";
import { resendSend } from "@/lib/axon/resend.mjs";
import { recordOutreachApproval } from "@/lib/axon/outreach-learn";
import { assertFireAllowed, FireHoldError } from "@/lib/axon/axon-fire-gate";

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

/**
 * Decision #1888 Phase 3 (BUILD-ARTIFACT-PIPELINE-OUTREACH-INTEGRATION-0914-03):
 * lets a reviewer edit a pending artifact's draft content before approving it.
 * Guarded on status=eq.pending, same compare-and-swap idempotency principle
 * decideReviewArtifact uses below — a no-op update targeting a row that has
 * already moved past pending (approved/rejected/needs_changes by someone else
 * in the meantime) simply matches zero rows instead of clobbering a decision.
 */
export async function editReviewArtifactDraft(id: string, newContent: string): Promise<ReviewArtifact> {
  const client = serviceClient();
  const { data: existing, error: fetchError } = await client
    .from("nvg_review_artifacts")
    .select(ARTIFACT_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error(`Artifact ${id} not found`);
  if (existing.status !== "pending") {
    throw new Error(`Artifact ${id} is no longer pending (status=${existing.status}) — cannot edit`);
  }
  if (existing.draft_content === newContent) {
    return existing; // no-op: nothing to write back
  }

  const { data, error } = await client
    .from("nvg_review_artifacts")
    .update({ draft_content: newContent })
    .eq("id", id)
    .eq("status", "pending")
    .select(ARTIFACT_FIELDS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Artifact ${id} was decided by someone else just now — refresh and retry`);
  return data;
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

  // nvg_review_artifacts_content_kind_check (live schema) only allows 'social_post' |
  // 'outreach_message' | 'other' — Outreach drafts use content_kind='outreach_message'
  // (see draftOutreachReviewArtifact in src/lib/axon/outreach-review-gate.ts).
  // created_by_agent='OUTREACH' is the precise discriminator for "this row has a
  // linked ni_brain_outreach lead via source_ref" so approving some other agent's
  // unrelated outreach_message artifact never triggers a real send.
  if (decision === "approved" && data.content_kind === "outreach_message" && data.created_by_agent === "OUTREACH") {
    await applyOutreachApprovalSideEffects(data);
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

function outreachSnippet(text: string | null | undefined, max = 160): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/** Best-effort Learnings write-back — the "learning loop" Decision #1888 calls for. */
async function writeOutreachLearning(text: string): Promise<void> {
  try {
    const { error } = await serviceClient().from("Learnings").insert({
      date: new Date().toISOString(),
      learning: text,
      source: "review-artifacts.ts",
      category: "outreach",
      project: "AXON / northside-intelligence",
      status: "active",
      applied_count: 0,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.warn("[ops/review-artifacts] failed to write outreach Learning:", err);
  }
}

/** Mirrors leads/[id]/approve/route.ts's logApproval — training signal is best-effort. */
async function logOutreachApprovalSignal(leadId: string): Promise<void> {
  try {
    await recordOutreachApproval(leadId, { operatorId: REVIEWER_IDENTITY });
  } catch {
    /* training signal is best-effort */
  }
}

/**
 * Decision #1888 Phase 3 (BUILD-ARTIFACT-PIPELINE-OUTREACH-INTEGRATION-0914-03):
 * Outreach drafts land in nvg_review_artifacts (content_kind="outreach_message",
 * created_by_agent="OUTREACH") mirrored alongside their live ni_brain_outreach lead
 * row (source_ref links the two — see draftOutreachReviewArtifact in
 * src/lib/axon/outreach-review-gate.ts). Approving the artifact here replicates
 * src/app/api/leads/[id]/approve/route.ts's verified-send mechanism exactly (same
 * fire-gate check, same linkedin/no-email/no-resendKey manual-fallback branches, same
 * resendSend call), using the artifact's (possibly-edited) draft_content as the send
 * body, then writes a Learning if the draft was edited before approval — the
 * "edit_diff" / "learning loop" this phase's ticket calls for. Never fatal to the
 * caller — the artifact decision itself has already committed by the time this runs
 * — EXCEPT that an actual send failure (not a fire-hold) is deliberately logged loudly
 * (console.error + a [OUTREACH-ARTIFACT-SEND-FAILED] Learning) rather than swallowed,
 * because a human will otherwise assume "Approved" meant "sent".
 */
async function applyOutreachApprovalSideEffects(artifact: ReviewArtifact): Promise<void> {
  if (!artifact.source_ref) return;

  try {
    const lead = await fetchLeadById(artifact.source_ref);
    if (!lead) {
      console.warn(
        `[ops/review-artifacts] outreach artifact ${artifact.id} approved but lead ${artifact.source_ref} was not found`
      );
      return;
    }

    const metadata = (artifact.metadata as Record<string, unknown> | null) || {};
    const originalDraft =
      typeof metadata.original_draft_content === "string" ? metadata.original_draft_content : null;
    const finalDraft = artifact.draft_content ?? null;

    if (originalDraft !== null && finalDraft !== null && originalDraft !== finalDraft) {
      await writeOutreachLearning(
        `[OUTREACH-ARTIFACT] artifact ${artifact.id} lead ${lead.id} edited before approval — before: "${outreachSnippet(
          originalDraft
        )}" after: "${outreachSnippet(finalDraft)}"`
      );
    }

    const channel = typeof metadata.channel === "string" ? metadata.channel : lead.meta?.channel;
    const contactEmail =
      typeof metadata.contact_email === "string" ? metadata.contact_email : lead.meta?.contact_email;
    const emailSubject =
      (typeof metadata.email_subject === "string" ? metadata.email_subject : lead.meta?.email_subject) ||
      `Northside Intelligence — ${lead.handle}`;

    // Same manual-fallback branches as leads/[id]/approve/route.ts, checked in the
    // same order and — critically — BEFORE the fire-gate check below: linkedin, no
    // contact email, or Resend not configured all leave the lead at 'approved' for a
    // human to send by hand without ever attempting resendSend, so none of them
    // should be blocked by AXON FIRE being on HOLD (route.ts only calls
    // assertFireAllowed immediately before its own resendSend call, not before these
    // manual-fallback branches — getting this order wrong would make a HOLD block
    // manual-send approvals that the un-gated route never blocked).
    if (channel === "linkedin" || !contactEmail) {
      await updateLeadStatus(lead.id, { status: "approved", comment_draft: finalDraft ?? undefined });
      await logOutreachApprovalSignal(lead.id);
      return;
    }

    const { sbSelect } = getAxonClient();
    const cfg = await loadConfig(sbSelect);

    if (!cfg.resendKey) {
      await updateLeadStatus(lead.id, { status: "approved", comment_draft: finalDraft ?? undefined });
      await logOutreachApprovalSignal(lead.id);
      return;
    }

    try {
      await assertFireAllowed("outreach.run");
    } catch (err) {
      if (err instanceof FireHoldError) {
        await writeOutreachLearning(
          `[OUTREACH-ARTIFACT] artifact ${artifact.id} lead ${lead.id} approved but send held — AXON FIRE gate is on HOLD (${err.message}); lead left unsent for manual send once fire resumes.`
        );
        return;
      }
      throw err;
    }

    try {
      await resendSend(cfg, {
        to: contactEmail,
        subject: emailSubject,
        html: finalDraft || "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[ops/review-artifacts] OUTREACH send FAILED for lead ${lead.id} (artifact ${artifact.id}) after human approval:`,
        err
      );
      await writeOutreachLearning(
        `[OUTREACH-ARTIFACT-SEND-FAILED] artifact ${artifact.id} lead ${lead.id} — resendSend failed: ${message}`
      );
      return;
    }

    await updateLeadStatus(lead.id, { status: "sent", dm_sent: true, comment_draft: finalDraft ?? undefined });
    await logOutreachApprovalSignal(lead.id);
  } catch (err) {
    console.warn(
      `[ops/review-artifacts] outreach approval side effects failed for artifact ${artifact.id}:`,
      err
    );
  }
}
