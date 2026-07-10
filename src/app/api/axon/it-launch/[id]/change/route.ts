import { NextRequest, NextResponse } from 'next/server';
import { requireAxonOperatorId } from '@/lib/axon/operator';
import { pushItLaunchNotification } from '@/lib/arm3/it-lifecycle';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const operatorId = await requireAxonOperatorId();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const summary = body.summary;
    const launchIdNum = Number(id.replace(/\D/g, '')) || Number(id);

    const supabase = createServiceClient();
    const { data: launch } = await supabase
      .from('arm3_it_launch_notifications')
      .select('id, opportunity_id, tool_slug, payload')
      .eq('id', launchIdNum)
      .maybeSingle();

    if (!launch) {
      return NextResponse.json({ error: 'Launch not found' }, { status: 404 });
    }

    const nextSummary = summary ?? launch.payload;
    const now = new Date().toISOString();

    await supabase
      .from('arm3_it_launch_notifications')
      .update({ payload: nextSummary, status: 'changes_requested', updated_at: now })
      .eq('id', launch.id);

    await supabase
      .from('arm3_opportunities')
      .update({ review_status: 'changes_requested', executive_summary: nextSummary })
      .eq('id', launch.opportunity_id);

    await pushItLaunchNotification({
      launchId: String(launch.id),
      opportunityId: launch.opportunity_id,
      toolSlug: launch.tool_slug,
      summary: nextSummary,
    });

    return NextResponse.json({
      ok: true,
      launchId: id,
      saved: nextSummary,
      operatorId,
      message: 'Change request saved — re-notification sent.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Change failed';
    const status = message === 'AXON access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
