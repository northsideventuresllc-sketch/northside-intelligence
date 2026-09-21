import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { reviewArtifact, REVIEW_STATUSES, type ReviewStatus } from "@/lib/ops/review-artifacts";

const DECISION_STATUSES: Set<ReviewStatus> = new Set(REVIEW_STATUSES.filter((s) => s !== "pending"));

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: { status?: string; reviewed_by?: string; reviewer_notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.status || !DECISION_STATUSES.has(body.status as ReviewStatus)) {
    return NextResponse.json(
      { error: "status must be one of approved|rejected|needs_changes" },
      { status: 400 }
    );
  }
  if (!body.reviewed_by || !body.reviewed_by.trim()) {
    return NextResponse.json({ error: "reviewed_by is required" }, { status: 400 });
  }

  try {
    const artifact = await reviewArtifact(
      id,
      body.status as Exclude<ReviewStatus, "pending">,
      body.reviewed_by.trim(),
      body.reviewer_notes
    );
    return NextResponse.json({ artifact });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
