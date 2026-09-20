import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * BUILD-ARTIFACT-PIPELINE-NI-API-UI-0914-02 (Decision #1888 / schema #1944)
 * Typed data access for public.nvg_review_artifacts — the shared human-review
 * surface for OUTREACH/CONTENT drafts across Sectors 1B/2/3/4/5 (NOT Match
 * Fit — Sector 1A keeps its own native portals). Server-only, service-role
 * client (RLS has no public policies on this table).
 */

export type ReviewArtifactContentKind = "social_post" | "outreach_message" | "other";
export type ReviewArtifactStatus = "pending" | "approved" | "rejected" | "needs_changes";

/** The three real decisions an operator can make on a pending artifact. */
export const REVIEW_ARTIFACT_DECISION_STATUSES = [
  "approved",
  "rejected",
  "needs_changes",
] as const;
export type ReviewArtifactDecisionStatus = (typeof REVIEW_ARTIFACT_DECISION_STATUSES)[number];

export function isReviewArtifactDecisionStatus(
  value: unknown
): value is ReviewArtifactDecisionStatus {
  return (
    typeof value === "string" &&
    (REVIEW_ARTIFACT_DECISION_STATUSES as readonly string[]).includes(value)
  );
}

export interface ReviewArtifact {
  id: string;
  ventureId: string;
  createdByAgent: string;
  contentKind: ReviewArtifactContentKind;
  title: string;
  draftContent: string | null;
  draftRef: string | null;
  draftFormat: string | null;
  platform: string | null;
  metadata: Record<string, unknown>;
  sourceRef: string | null;
  dedupeKey: string | null;
  status: ReviewArtifactStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  revisionOf: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): ReviewArtifact {
  return {
    id: String(row.id),
    ventureId: String(row.venture_id),
    createdByAgent: String(row.created_by_agent),
    contentKind: row.content_kind as ReviewArtifactContentKind,
    title: String(row.title),
    draftContent: row.draft_content != null ? String(row.draft_content) : null,
    draftRef: row.draft_ref != null ? String(row.draft_ref) : null,
    draftFormat: row.draft_format != null ? String(row.draft_format) : null,
    platform: row.platform != null ? String(row.platform) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    sourceRef: row.source_ref != null ? String(row.source_ref) : null,
    dedupeKey: row.dedupe_key != null ? String(row.dedupe_key) : null,
    status: row.status as ReviewArtifactStatus,
    reviewedBy: row.reviewed_by != null ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at != null ? String(row.reviewed_at) : null,
    reviewerNotes: row.reviewer_notes != null ? String(row.reviewer_notes) : null,
    revisionOf: row.revision_of != null ? String(row.revision_of) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** List pending artifacts, oldest first, optionally scoped to one venture. */
export async function listPendingReviewArtifacts(
  opts: { ventureId?: string; limit?: number } = {}
): Promise<ReviewArtifact[]> {
  const { ventureId, limit = 200 } = opts;
  const supabase = createServiceClient();

  let query = supabase
    .from("nvg_review_artifacts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (ventureId) {
    query = query.eq("venture_id", ventureId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list review artifacts: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export interface ReviewArtifactDecisionInput {
  status: ReviewArtifactDecisionStatus;
  reviewedBy: string;
  reviewerNotes?: string | null;
}

/**
 * Record an operator's decision on one artifact. Returns null if no row
 * matched `id` (caller should treat that as a 404).
 */
export async function decideReviewArtifact(
  id: string,
  decision: ReviewArtifactDecisionInput
): Promise<ReviewArtifact | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("nvg_review_artifacts")
    .update({
      status: decision.status,
      reviewed_by: decision.reviewedBy,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: decision.reviewerNotes ?? null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update review artifact: ${error.message}`);
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}
