import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { decideReviewArtifact, editReviewArtifactDraft } from "@/lib/ops/review-artifacts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reviewerNotes = typeof body?.reviewer_notes === "string" ? body.reviewer_notes : null;
  const draftContent = typeof body?.draft_content === "string" ? body.draft_content : null;

  try {
    // An edit made in the review UI just before approving is applied first (still
    // guarded on status=eq.pending), so decideReviewArtifact's approval side effects
    // — including the outreach send — always act on the final, human-approved text.
    if (draftContent !== null) {
      await editReviewArtifactDraft(id, draftContent);
    }
    const artifact = await decideReviewArtifact(id, "approved", reviewerNotes);
    return NextResponse.json({ artifact });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Approve failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
