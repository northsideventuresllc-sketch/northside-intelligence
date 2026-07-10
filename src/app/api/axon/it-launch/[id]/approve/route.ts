import { NextRequest, NextResponse } from 'next/server';
import { requireAxonOperatorId } from '@/lib/axon/operator';
import { approveItLaunch } from '@/lib/arm3/it-lifecycle';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const operatorId = await requireAxonOperatorId();
    const { id } = await context.params;
    const result = await approveItLaunch(id, operatorId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Approve failed';
    const status = message === 'AXON access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
