'use client';

import { apiUrl } from '@/lib/axon/api-base';
import type { AxonNotification } from '@/lib/axon/axon-types';
import type { ItTestFixtureKey } from '@/lib/axon/it-notification-fixtures';

/** Fire a master-only IT/test notification and announce it to the AXON home UI. */
export async function fireItTestNotification(fixture: ItTestFixtureKey): Promise<AxonNotification> {
  const res = await fetch(apiUrl('/api/axon/notifications/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixture }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Test notification failed');
  }
  const notification = data.notification as AxonNotification;
  if (typeof window !== 'undefined' && notification) {
    window.dispatchEvent(new CustomEvent('axon:test-notification', { detail: { notification } }));
  }
  return notification;
}
