import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/infra/cron-auth';
import { runOutreachSender } from '@/lib/axon/outreach-sender';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// OUT-SENDER. Picks up messages JB approved on the Monday screen and sends
// the ones whose batch is approved and whose venture switch is ON. Both
// match_fit.outreach and ni.outreach are OFF as of 2026-07-26 — every run
// while that holds should report skippedSwitchOff > 0 and sent === 0.
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
