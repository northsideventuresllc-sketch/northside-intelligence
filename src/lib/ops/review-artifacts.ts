import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NI_BRAIN_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kxijunwgbrlfzvgkhklo.supabase.co";

function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export const REVIEW_STATUSES = ["pending", "approved", "rejected", "needs_changes"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CONTENT_KINDS = ["social_post", "outreach_message", "other"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export type ReviewArtifact = {
  id: string;
  venture_id: string;
  created_by_agent: string;
  content_kind: ContentKind;
  title: string | null;
  draft_content: string | null;
  draft_ref: string | null;
  draft_format: string | null;
  platform: string | null;
  metadata: Record<string, unknown> | null;
  source_ref: string | null;
  status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  revision_of: string | null;
  created_at: string;
  updated_at: string;
};

const ARTIFACT_FIELDS =
  "id,venture_id,created_by_agent,content_kind,title,draft_content,draft_ref,draft_format,platform,metadata,source_ref,status,reviewed_by,reviewed_at,reviewer_notes,revision_of,created_at,updated_at";

export async function listArtifacts(): Promise<ReviewArtifact[]> {
  const { data, error } = await serviceClient()
    .from("nvg_review_artifacts")
    .select(ARTIFACT_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Direct UPDATE, not an RPC — Decision #1944 picked this table specifically so review-gating
 * is enforced by the DB CHECK (reviewed_when_decided: a row can't leave pending without a
 * named reviewer), reusing that constraint instead of adding new approve/reject plumbing.
 */
export async function reviewArtifact(
  id: string,
  status: Exclude<ReviewStatus, "pending">,
  reviewedBy: string,
  reviewerNotes?: string | null
): Promise<ReviewArtifact> {
  const client = serviceClient();
  const { data, error } = await client
    .from("nvg_review_artifacts")
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes ?? null,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select(ARTIFACT_FIELDS)
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Artifact not found or already reviewed");
  return data;
}
