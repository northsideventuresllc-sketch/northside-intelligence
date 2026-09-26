import { getClient } from './leads';
import type { LeadWithMeta } from './types';

/**
 * Phase 3 of the Universal Operator Review Artifact Pipeline (Decision #1888,
 * BUILD-ARTIFACT-PIPELINE-OUTREACH-INTEGRATION-0914-03).
 *
 * OUTREACH still writes its draft onto the lead row in ni_brain_outreach
 * (comment_draft / dm_draft, status='pending_approval') — the existing
 * find -> score -> draft -> approve -> send -> follow-up -> close pipeline in
 * this repo (leads.ts, outreach-lifecycle.ts, the `/api/leads/[id]/approve`
 * verified-send route) still reads and writes that row directly and is not
 * touched by this phase. This module mirrors a review-queue row alongside it
 * (same nvg_review_artifacts table Phase 2/4 already built the NI Portal Ops
 * review UI against) so a human approves the draft there before it can be
 * sent, exactly like CONTENT's social_post artifacts
 * (src/lib/content-machine/review-gate.ts).
 *
 * Call site: fetchLeads() in leads.ts, the read path the NI Portal Outreach
 * HQ pages (ni-outreach / mf-outreach) use to list leads awaiting a human's
 * action. There is no lead-creation code path left in this repo to hook —
 * Decision #1767 rewired lead generation to hand the job to the OUTREACH
 * agent over `agent_bus` (see outreach-run-core.mjs), which writes new
 * ni_brain_outreach rows directly from its own process. fetchLeads() already
 * runs a best-effort side effect on every call (sweepLeadLifecycle) before
 * returning, so ensuring a review artifact exists for each pending_approval
 * lead here follows that same established idiom, and is the earliest point
 * in this codebase where a human is about to see the draft. The unique
 * partial index on dedupe_key (WHERE status IN ('pending','needs_changes'))
 * makes repeat calls a no-op once the first artifact exists.
 */
export async function draftOutreachReviewArtifact(lead: LeadWithMeta): Promise<void> {
  if (!lead.comment_draft) return;

  const { sbSelect, sbInsert } = getClient();
  const dedupeKey = `outreach:${lead.id}`;

  const existing = (await sbSelect(
    'nvg_review_artifacts',
    `dedupe_key=eq.${encodeURIComponent(dedupeKey)}&status=in.(pending,needs_changes)&select=id&limit=1`
  )) as { id: string }[];
  if (existing?.length) return;

  const meta = lead.meta || {};

  try {
    await sbInsert('nvg_review_artifacts', {
      venture_id: 'ni',
      created_by_agent: 'OUTREACH',
      // nvg_review_artifacts_content_kind_check only allows 'social_post' |
      // 'outreach_message' | 'other' (Phase 1 schema) — an Outreach draft
      // maps to 'outreach_message'.
      content_kind: 'outreach_message',
      title: `Outreach — ${lead.handle}`,
      draft_content: lead.comment_draft,
      draft_format: 'outreach_message',
      platform: meta.channel || null,
      source_ref: lead.id,
      dedupe_key: dedupeKey,
      metadata: {
        original_draft_content: lead.comment_draft,
        contact_email: meta.contact_email || null,
        email_subject: meta.email_subject || null,
        channel: meta.channel || null,
      },
    });
  } catch (err) {
    // Best-effort: a concurrent call may have just inserted the same
    // dedupe_key (unique partial index) between our check and our insert —
    // that race is exactly the idempotency the index exists to resolve, not
    // a real failure. Any other error is logged but never blocks the read
    // path this runs from.
    console.warn(`[outreach-review-gate] failed to draft review artifact for lead ${lead.id}:`, err);
  }
}
