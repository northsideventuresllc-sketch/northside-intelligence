import { redirect } from 'next/navigation';
import { AxonTrustHaltControl } from '@/components/axon-ui/axon-trust-halt-control';
import {
  getGlobalHaltStatus,
  getMoralityPinStatus,
  getRecentMoralityAudit,
} from '@/lib/axon/morality-trust';
import { requireAxonMasterOperatorId } from '@/lib/axon/operator';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';

export const dynamic = 'force-dynamic';

export default async function AxonTrustPage({ params }: { params: { username: string } }) {
  await requireAxonPortalUser(params.username);

  // requireAxonPortalUser only enforces canEnterAxonPortal, which access.ts documents as a
  // pre-launch gate that will later widen to entitled purchasers. This page must stay
  // master-only even after that happens, so it re-checks isMasterAccount directly (same
  // check the halt route uses) rather than relying on the portal gate alone.
  try {
    await requireAxonMasterOperatorId();
  } catch {
    redirect('/axon');
  }

  const [pin, haltStatus, auditEvents] = await Promise.all([
    getMoralityPinStatus(),
    getGlobalHaltStatus(),
    getRecentMoralityAudit(20),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold axon-gradient-text">Trust</h1>
        <p className="mt-1 text-sm text-axon-muted">
          Morality pin status, the global kill switch, and recent governance activity.
        </p>
      </header>

      <section className="rounded-xl border border-axon-border bg-axon-surface p-6 axon-glass">
        <h2 className="text-sm font-medium">Morality Pin</h2>
        {pin ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-axon-muted">Active version</dt>
              <dd className="font-mono">{pin.version}</dd>
            </div>
            <div>
              <dt className="text-axon-muted">Approved by</dt>
              <dd>{pin.approvedBy ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-axon-muted">Content SHA-256</dt>
              <dd className="truncate font-mono text-xs">{pin.contentSha256}</dd>
            </div>
            <div>
              <dt className="text-axon-muted">Pinned since</dt>
              <dd>{new Date(pin.createdAt).toLocaleString()}</dd>
            </div>
            {pin.purposeLock && (
              <div className="sm:col-span-2">
                <dt className="text-axon-muted">Purpose lock</dt>
                <dd className="text-xs">{pin.purposeLock}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-axon-muted">No active morality version is pinned.</p>
        )}
      </section>

      <AxonTrustHaltControl initial={haltStatus} />

      <section className="rounded-xl border border-axon-border bg-axon-surface p-6 axon-glass">
        <h2 className="text-sm font-medium">Recent Governance Events</h2>
        {auditEvents.length === 0 ? (
          <p className="mt-4 text-sm text-axon-muted">No morality gate activity recorded yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {auditEvents.map((event) => (
              <div
                key={event.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-xs ${
                  event.isDenial ? 'border-axon-danger/40 bg-axon-danger/5' : 'border-axon-border'
                }`}
              >
                <span className={event.isDenial ? 'font-medium text-axon-danger' : ''}>
                  [{event.eventType}
                  {event.actionClass ? ` · ${event.actionClass}` : ''}] {event.actor ?? 'system'}
                </span>
                <span className="font-mono text-axon-muted">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
