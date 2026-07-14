import { NextRequest, NextResponse } from 'next/server';
import { requireAxonOperatorId } from '@/lib/axon/operator';
import { removeItReport } from '@/lib/arm3/it-lifecycle';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAxonOperatorId();
    const { id } = await context.params;
    let toolSlug: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.toolSlug === 'string') toolSlug = body.toolSlug;
    } catch {
      /* no body */
    }
    const result = await removeItReport(id, toolSlug);
    if (!result.ok) {
      const status =
        result.error === 'not_found'
          ? 404
          : result.error === 'locked_until_expires'
            ? 409
            : 400;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Remove failed';
    const status = message === 'AXON access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
