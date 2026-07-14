import { NextRequest, NextResponse } from 'next/server';
import { requireAxonOperatorId } from '@/lib/axon/operator';
import { reviveArchivedTool } from '@/lib/arm3/it-lifecycle';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireAxonOperatorId();
    const body = await req.json();
    const slug = typeof body.slug === 'string' ? body.slug : '';
    const trialDays = body.trialDays === 90 ? 90 : 30;

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const result = await reviveArchivedTool(slug, trialDays);
    if (!result.ok) {
      const status = result.error === 'not_found' ? 404 : 400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Revive failed';
    const status = message === 'AXON access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
