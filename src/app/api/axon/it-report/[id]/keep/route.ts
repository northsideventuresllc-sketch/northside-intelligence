import { NextRequest, NextResponse } from 'next/server';
import { requireAxonOperatorId } from '@/lib/axon/operator';
import { keepItReport } from '@/lib/arm3/it-lifecycle';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAxonOperatorId();
    const { id } = await context.params;
    return NextResponse.json(await keepItReport(id));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Keep failed';
    const status = message === 'AXON access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
