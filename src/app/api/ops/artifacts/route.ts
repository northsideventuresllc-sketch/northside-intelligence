import { NextResponse } from "next/server";
import { requireOpsSession } from "@/lib/ops/guard";
import { listReviewArtifacts } from "@/lib/ops/review-artifacts";

export async function GET() {
  const unauthorized = await requireOpsSession();
  if (unauthorized) return unauthorized;

  try {
    const artifacts = await listReviewArtifacts();
    return NextResponse.json({ artifacts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load artifacts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
