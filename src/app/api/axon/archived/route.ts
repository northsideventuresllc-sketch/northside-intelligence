import { NextResponse } from 'next/server';
import { requireAxonOperatorId } from '@/lib/axon/operator';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** List archived ITs — master operator only (403 otherwise). */
export async function GET() {
  try {
    await requireAxonOperatorId();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('arm3_archived_tools')
      .select('id, tool_slug, name, description, removed_at, revival_eligible, revival_score')
      .order('removed_at', { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rows: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'List failed';
    const status = message === 'AXON access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
