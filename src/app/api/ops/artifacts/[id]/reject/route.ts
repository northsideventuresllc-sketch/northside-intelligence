import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { decideReviewArtifact } from "@/lib/ops/review-artifacts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reviewerNotes = typeof body?.reviewer_notes === "string" ? body.reviewer_notes.trim() : "";
  if (!reviewerNotes) {
    return NextResponse.json({ error: "reviewer_notes is required to reject an artifact" }, { status: 400 });
  }

  try {
    const artifact = await decideReviewArtifact(id, "rejected", reviewerNotes);
    return NextResponse.json({ artifact });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reject failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
