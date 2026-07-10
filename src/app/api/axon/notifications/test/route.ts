import { NextRequest, NextResponse } from 'next/server';
import { addNotification } from '@/lib/axon/axon-preferences';
import { buildItTestNotification, type ItTestFixtureKey } from '@/lib/axon/it-notification-fixtures';
import { requireAxonOperatorId } from '@/lib/axon/operator';

export const dynamic = 'force-dynamic';

const VALID_FIXTURES: ItTestFixtureKey[] = [
  'it_launch',
  'it_90_day',
  'archive_revival',
  'outreach_draft',
];

export async function POST(req: NextRequest) {
  try {
    const operatorId = await requireAxonOperatorId();
    const body = await req.json().catch(() => ({}));
    const fixture = body.fixture as ItTestFixtureKey;

    if (!fixture || !VALID_FIXTURES.includes(fixture)) {
      return NextResponse.json(
        { error: 'Invalid fixture. Use: it_launch, it_90_day, archive_revival, outreach_draft' },
        { status: 400 }
      );
    }

    const notification = buildItTestNotification(fixture);
    const preferences = await addNotification(notification, operatorId);
    const saved = preferences.notificationsInbox[0];

    return NextResponse.json({ ok: true, notification: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Test notification failed';
    const status = message === 'AXON access denied' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
