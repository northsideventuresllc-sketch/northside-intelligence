import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorizedAsync } from '@/lib/infra/cron-auth';
import { hydratePlatformEnvFromDatabase } from '@/lib/hydrate-platform-env';
import { pushItReportNotification } from '@/lib/arm3/it-lifecycle';
import { collectToolMetrics, toReportMetrics } from '@/lib/arm3/it-metrics';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

type EvalCandidate = {
  slug: string;
  name: string;
  price_usd: number | null;
  reportType: 'ninety_day' | 'trial_extension';
  periodDays: number;
};

export async function GET(req: NextRequest) {
  await hydratePlatformEnvFromDatabase();

  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const cutoff90 = new Date(Date.now() - NINETY_DAYS_MS).toISOString();
  const evalWeek = nowIso.slice(0, 10);

  const candidates: EvalCandidate[] = [];

  // Production tools past 90 days, unlocked (null or lock expired)
  const { data: productionTools, error: prodError } = await supabase
    .from('arm3_tools')
    .select('slug, name, price_usd, production_launched_at, lifecycle_locked_until, lifecycle_phase')
    .eq('lifecycle_phase', 'production')
    .not('production_launched_at', 'is', null)
    .lte('production_launched_at', cutoff90);

  if (prodError) {
    return NextResponse.json({ error: prodError.message }, { status: 500 });
  }

  for (const tool of productionTools ?? []) {
    const lockedUntil = tool.lifecycle_locked_until
      ? new Date(tool.lifecycle_locked_until)
      : null;
    if (lockedUntil && lockedUntil > now) continue;
    candidates.push({
      slug: tool.slug,
      name: tool.name,
      price_usd: tool.price_usd,
      reportType: 'ninety_day',
      periodDays: 90,
    });
  }

  // Trial tools whose extension window ended → new IT Report
  const { data: trialTools, error: trialError } = await supabase
    .from('arm3_tools')
    .select('slug, name, price_usd, trial_extension_until')
    .eq('lifecycle_phase', 'trial')
    .not('trial_extension_until', 'is', null)
    .lte('trial_extension_until', nowIso);

  if (trialError) {
    return NextResponse.json({ error: trialError.message }, { status: 500 });
  }

  for (const tool of trialTools ?? []) {
    candidates.push({
      slug: tool.slug,
      name: tool.name,
      price_usd: tool.price_usd,
      reportType: 'trial_extension',
      periodDays: 30,
    });
  }

  const notified: string[] = [];
  const skipped: string[] = [];

  for (const tool of candidates) {
    const { data: existingEval } = await supabase
      .from('arm3_tool_evals')
      .select('id')
      .eq('tool_slug', tool.slug)
      .eq('eval_week', evalWeek)
      .maybeSingle();

    if (existingEval) {
      skipped.push(tool.slug);
      continue;
    }

    const snapshot = await collectToolMetrics({
      toolSlug: tool.slug,
      toolName: tool.name,
      periodDays: tool.periodDays,
      priceUsd: tool.price_usd,
    });

    const prefix = tool.reportType === 'trial_extension' ? 'report-trial' : 'report-90d';
    const reportId = `${prefix}-${tool.slug}-${evalWeek}`;

    await pushItReportNotification({
      reportId,
      metrics: toReportMetrics({
        reportType: tool.reportType,
        toolSlug: tool.slug,
        toolName: tool.name,
        periodDays: tool.periodDays,
        snapshot,
      }),
    });
    notified.push(tool.slug);

    await supabase.from('arm3_tool_evals').insert({
      tool_slug: tool.slug,
      eval_week: evalWeek,
      signups_total: snapshot.signups,
      usage_events: snapshot.usageEvents,
      paying_users: snapshot.payingUsers,
      revenue_usd: snapshot.mrrUsd,
      score:
        snapshot.aiRecommendation === 'keep'
          ? 0.85
          : snapshot.aiRecommendation === 'trial'
            ? 0.55
            : 0.25,
      verdict:
        snapshot.aiRecommendation === 'keep'
          ? 'keep'
          : snapshot.aiRecommendation === 'trial'
            ? 'adjust'
            : 'scrap',
      notes:
        tool.reportType === 'trial_extension'
          ? 'Trial extension follow-up report sent'
          : '90-day evaluation notification sent',
    });

    // Clear spent trial window. Stay in trial until JB decides KEEP/TRIAL/REMOVE
    // so we do not immediately re-enter the 90-day production eval lane.
    if (tool.reportType === 'trial_extension') {
      await supabase
        .from('arm3_tools')
        .update({
          trial_extension_until: null,
        })
        .eq('slug', tool.slug);
    }
  }

  return NextResponse.json({
    ok: true,
    evaluated: notified.length,
    skipped: skipped.length,
    tools: notified,
    skippedTools: skipped,
  });
}
