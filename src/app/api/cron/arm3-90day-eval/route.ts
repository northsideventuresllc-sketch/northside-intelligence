import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorizedAsync } from '@/lib/infra/cron-auth';
import { hydratePlatformEnvFromDatabase } from '@/lib/hydrate-platform-env';
import { pushItReportNotification } from '@/lib/arm3/it-lifecycle';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  await hydratePlatformEnvFromDatabase();

  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - NINETY_DAYS_MS).toISOString();

  const { data: tools, error } = await supabase
    .from('arm3_tools')
    .select('slug, name, production_launched_at, lifecycle_locked_until, lifecycle_phase')
    .eq('lifecycle_phase', 'production')
    .not('production_launched_at', 'is', null)
    .lte('production_launched_at', cutoff)
    .is('lifecycle_locked_until', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notified: string[] = [];

  for (const tool of tools ?? []) {
    const evalWeek = new Date().toISOString().slice(0, 10);
    const { data: existingEval } = await supabase
      .from('arm3_tool_evals')
      .select('id')
      .eq('tool_slug', tool.slug)
      .eq('eval_week', evalWeek)
      .maybeSingle();

    if (existingEval) continue;

    const reportId = `report-90d-${tool.slug}-${evalWeek}`;
    await pushItReportNotification({
      reportId,
      metrics: {
        reportType: 'ninety_day',
        toolSlug: tool.slug,
        toolName: tool.name,
        periodDays: 90,
        signups: 0,
        activeUsers: 0,
        payingUsers: 0,
        mrrUsd: 0,
        churnPct: 0,
        usageEvents: 0,
        topFeatures: [],
        aiRecommendation: 'keep',
        rationale: `${tool.name} reached 90-day evaluation window. Review metrics in AXON and choose KEEP, TRIAL, or REMOVE.`,
      },
    });
    notified.push(tool.slug);

    await supabase.from('arm3_tool_evals').insert({
      tool_slug: tool.slug,
      eval_week: evalWeek,
      verdict: 'pending',
      notes: '90-day evaluation notification sent',
    });
  }

  return NextResponse.json({
    ok: true,
    evaluated: notified.length,
    tools: notified,
  });
}
