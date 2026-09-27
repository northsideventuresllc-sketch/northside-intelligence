import { requireAxonPortalUser } from '@/lib/axon/portal-guard';
import { loadAgentHealthBoard } from '@/lib/axon/agent-health-board';

export const dynamic = 'force-dynamic';

const DOT_COLOR: Record<string, string> = {
  Healthy: 'bg-emerald-500',
  'Needs attention': 'bg-amber-500',
  Broken: 'bg-red-500',
  Stale: 'bg-zinc-400',
  Archived: 'bg-zinc-300',
};

function StatDot({ chip }: { chip: string }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${DOT_COLOR[chip] ?? 'bg-zinc-400'}`}
      aria-hidden
    />
  );
}

function usd(n: number | null): string {
  if (n === null) return 'Not available';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function count(n: number | null): string {
  return n === null ? 'Not available' : String(n);
}

/**
 * Admin-only agent health board (FRONTIER-09-JB-HEALTH-DASHBOARD). One row
 * per agent, green/yellow/red from live NI-Brain data, plain-English labels
 * only — no table names, no raw status codes on screen. Gated by the same
 * requireAxonPortalUser check every /axon/u/[username]/tools/* page uses.
 */
export default async function AgentHealthPage({ params }: { params: { username: string } }) {
  await requireAxonPortalUser(params.username);
  const board = await loadAgentHealthBoard();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Agent Health</h1>
      <p className="mt-1 text-sm text-zinc-500">
        One row per agent. Green means healthy, yellow means it needs a look, red means it is not
        responding.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Waiting on review</div>
          <div className="mt-1 text-xl font-semibold">{count(board.totals.prsWaitingReview)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Finished today</div>
          <div className="mt-1 text-xl font-semibold">{count(board.totals.ticketsFinishedToday)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Open right now</div>
          <div className="mt-1 text-xl font-semibold">{count(board.totals.openTickets)}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="text-xs text-zinc-500">Spend this week</div>
          <div className="mt-1 text-xl font-semibold">{usd(board.totals.costThisWeekUsd)}</div>
        </div>
      </div>

      <div className="mt-8">
        {!board.readable ? (
          <p className="text-sm text-zinc-500">No agent data available right now.</p>
        ) : board.rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No active agents on the roster.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">What it does</th>
                <th className="py-2 pr-4">Last seen</th>
                <th className="py-2 pr-4">Open tickets</th>
              </tr>
            </thead>
            <tbody>
              {board.rows.map((row) => (
                <tr key={row.name} className="border-b border-zinc-100">
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-2">
                      <StatDot chip={row.chip} />
                      <span>{row.chip}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-medium">{row.name}</td>
                  <td className="py-2 pr-4 text-zinc-600">{row.summary ?? 'No summary yet'}</td>
                  <td className="py-2 pr-4 text-zinc-500">{row.lastSeen ?? 'Never seen'}</td>
                  <td className="py-2 pr-4">{row.openTickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
