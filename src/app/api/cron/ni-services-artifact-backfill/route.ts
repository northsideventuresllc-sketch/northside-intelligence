import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/infra/cron-auth';
import { runNiServicesArtifactBackfill } from '@/lib/axon/leads';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// NI-OUTREACH-ARTIFACT-CONCURRENCY-0915. The only place NI Services artifact
// generation is triggered from — it used to fire inline inside fetchLeads()/
// fetchLeadById() on every ordinary read, which meant a plain page load could
// push a live commit to nv-vault with no on/off switch and no concurrency
// guard (council-blocked on PR #247). Now it only runs when the scheduler (or
// a manual trigger, same auth) hits this route on purpose, it no-ops unless
// the `ni.artifact_backfill` automation_controls switch is explicitly ON, and
// each lead is claimed atomically so overlapping invocations can't
// double-generate/double-push the same lead.
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const outcome = await runNiServicesArtifactBackfill();
    return NextResponse.json({ ok: true, ...outcome });
  } catch (err) {
    console.error('[cron/ni-services-artifact-backfill]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'NI Services artifact backfill failed' },
      { status: 500 },
    );
  }
}

// Manual trigger for testing (same auth, POST alias).
export const POST = GET;
