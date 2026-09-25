import { NextRequest, NextResponse } from 'next/server';
import { listPendingReviewArtifacts } from '@/lib/axon/reviewArtifacts';
import { requireAxonOperatorId } from '@/lib/axon/operator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAxonOperatorId();
    const ventureId = req.nextUrl.searchParams.get('venture_id');
    const items = await listPendingReviewArtifacts({
      ventureId: ventureId?.trim() ? ventureId.trim() : undefined,
    });
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list review artifacts';
    const status = message === 'AXON access denied' ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
