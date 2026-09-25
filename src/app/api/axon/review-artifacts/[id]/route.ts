import { NextRequest, NextResponse } from 'next/server';
import {
  decideReviewArtifact,
  isReviewArtifactDecisionStatus,
  REVIEW_ARTIFACT_DECISION_STATUSES,
} from '@/lib/axon/reviewArtifacts';
import { requireAxonOperatorId } from '@/lib/axon/operator';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const operatorId = await requireAxonOperatorId();
    const { id } = await context.params;

    const body = await req.json().catch(() => ({}) as Record<string, unknown>);
    const status = (body as Record<string, unknown>).status;

    if (!isReviewArtifactDecisionStatus(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${REVIEW_ARTIFACT_DECISION_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const rawNotes = (body as Record<string, unknown>).reviewer_notes;
    const reviewerNotes = typeof rawNotes === 'string' ? rawNotes.trim() || null : undefined;

    const updated = await decideReviewArtifact(id, {
      status,
      reviewedBy: operatorId,
      reviewerNotes,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update review artifact';
    const status = message === 'AXON access denied' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
