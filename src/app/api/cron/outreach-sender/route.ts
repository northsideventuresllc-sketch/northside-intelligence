import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/infra/cron-auth';
import { runOutreachSender } from '@/lib/axon/outreach-sender';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// OUT-SENDER. Picks up messages JB approved in that venture's own outreach
// surface (NI Outreach HQ for NI, Match Fit Outreach HQ for Match Fit — the
// shared Monday Approvals screen was deleted 2026-08-04 by
// MF-KILL-MONDAY-APPROVALS) and sends the ones whose batch is approved and
// whose venture switch is ON. The switch state is read live from
// automation_controls on every run — do not hardcode a belief about it here.
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const outcome = await runOutreachSender();
    return NextResponse.json({ ok: true, ...outcome });
  } catch (err) {
    console.error('[cron/outreach-sender]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Outreach sender failed' },
      { status: 500 },
    );
  }
}

// Manual trigger for testing (same auth, POST alias).
export const POST = GET;
