import { NextResponse } from 'next/server';
import {
  fetchMondayReview,
  approveMessages,
  rejectMessages,
  purgeJunk,
} from '@/lib/axon/monday-review';
import { requireAxonOperatorId } from '@/lib/axon/operator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAxonOperatorId();
    const data = await fetchMondayReview();
    return NextResponse.json({
      approvable: data.approvable,
      needsCleanup: data.needsCleanup,
      counts: { approvable: data.approvable.length, needsCleanup: data.needsCleanup.length },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Monday review failed';
    return NextResponse.json(
      { error: message },
      { status: message === 'AXON access denied' ? 401 : 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const operatorId = await requireAxonOperatorId();
    const body = (await req.json()) as {
      action?: 'approve' | 'reject' | 'purge';
      messageIds?: string[];
      reason?: string;
      dailyCap?: number;
    };
    const ids = Array.isArray(body.messageIds) ? body.messageIds.filter(Boolean) : [];

    if (body.action === 'approve') {
      if (!ids.length) return NextResponse.json({ error: 'Nothing selected' }, { status: 400 });
      const batches = await approveMessages(ids, operatorId || 'JB', body.dailyCap ?? 25);
      const approved = batches.reduce((n, b) => n + (b.approved || 0), 0);
      return NextResponse.json({
        ok: true,
        approved,
        batches,
        message: `Approved ${approved} — queued to send.`,
      });
    }

    if (body.action === 'reject') {
      if (!ids.length) return NextResponse.json({ error: 'Nothing selected' }, { status: 400 });
      const rejected = await rejectMessages(ids, body.reason || 'not a fit');
      return NextResponse.json({ ok: true, rejected, message: `Rejected ${rejected}.` });
    }

    if (body.action === 'purge') {
      const purged = await purgeJunk(body.reason || 'junk draft — wrong ICP');
      return NextResponse.json({ ok: true, purged, message: `Cleared ${purged} junk drafts.` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Action failed';
    return NextResponse.json(
      { error: message },
      { status: message === 'AXON access denied' ? 401 : 500 },
    );
  }
}
