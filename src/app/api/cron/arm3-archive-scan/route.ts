import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorizedAsync } from '@/lib/infra/cron-auth';
import { hydratePlatformEnvFromDatabase } from '@/lib/hydrate-platform-env';
import { pushItReportNotification } from '@/lib/arm3/it-lifecycle';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const REVIVAL_SCORE_THRESHOLD = 0.72;

export async function GET(req: NextRequest) {
  await hydratePlatformEnvFromDatabase();

  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const monthKey = new Date().toISOString().slice(0, 7);

  const { data: archived, error } = await supabase
    .from('arm3_archived_tools')
    .select('id, tool_slug, name, description, revival_eligible, revival_score, snapshot, last_revival_scan_at')
    .eq('revival_eligible', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidates: string[] = [];

  for (const row of archived ?? []) {
    const monthStart = `${monthKey}-01`;
    if (row.last_revival_scan_at && String(row.last_revival_scan_at).startsWith(monthKey)) {
      continue;
    }

    const score =
      row.revival_score ??
      (row.description?.length ? Math.min(0.85, 0.5 + row.description.length / 500) : 0.4);

    if (score < REVIVAL_SCORE_THRESHOLD) continue;

    const reportId = `revival-${row.tool_slug}-${monthKey}`;
    await pushItReportNotification({
      reportId,
      metrics: {
        reportType: 'archive_revival',
        toolSlug: row.tool_slug,
        toolName: row.name,
        periodDays: 30,
        signups: 0,
        activeUsers: 0,
        payingUsers: 0,
        mrrUsd: 0,
        churnPct: 0,
        usageEvents: 0,
        topFeatures: [],
        aiRecommendation: 'trial',
        rationale: `Archive scan score ${(score * 100).toFixed(0)}% — market patterns suggest ${row.name} deserves another 30-day trial.`,
      },
    });

    await supabase
      .from('arm3_archived_tools')
      .update({ last_revival_scan_at: new Date().toISOString(), revival_score: score })
      .eq('id', row.id);

    candidates.push(row.tool_slug);
  }

  return NextResponse.json({
    ok: true,
    month: monthKey,
    revivalCandidates: candidates.length,
    tools: candidates,
  });
}
