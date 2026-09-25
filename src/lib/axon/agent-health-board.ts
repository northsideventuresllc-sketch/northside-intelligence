/**
 * FRONTIER-09-JB-HEALTH-DASHBOARD — server-side reads behind the admin-only
 * agent health board. Same fail-safe shape as lib/axon/face-reads.ts: the
 * service key never reaches the browser, and every read resolves to `null`
 * (or an empty list) on any failure rather than throwing — a source that
 * cannot be read just leaves its own part of the board blank, never crashes
 * the page.
 *
 * Tables read, all read-only:
 *   nvg_agent_routines — the roster: one row per agent, its health_status
 *                        and a plain-English function_summary
 *   nvg_agent_presence — heartbeats (last_seen_at) used as a recency signal
 *                        when a routine row has no health_status of its own
 *   agent_dispatch     — open tickets per agent, PRs waiting on council
 *                        review, and tickets finished today
 *   axon_cost_ledger    — cost_usd summed over the last 7 days
 *
 * Never prints a raw status code, table name, or id on screen — the page
 * that renders this only ever uses the `chip`/`chipLabel` plain-English
 * fields below (rosterHealthChip / plainRelativeTime from plain-labels.ts).
 */
import { createSupabaseClient } from '@/lib/axon/supabase.mjs';
import { SUPABASE_URL } from '@/lib/axon/constants.mjs';
import {
  rosterHealthChip,
  rosterHealthChipClass,
  plainRelativeTime,
  type RosterHealthChip,
} from '@/lib/axon/axon-v0/plain-labels';

function serviceKey(): string {
  return process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function sb() {
  return createSupabaseClient(serviceKey()) as {
    sbSelect: (t: string, f?: string) => Promise<unknown[]>;
  };
}

async function readOrEmpty(table: string, filter: string): Promise<Record<string, unknown>[]> {
  try {
    const rows = await sb().sbSelect(table, filter);
    return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

async function countRows(table: string, filter: string): Promise<number | null> {
  const key = serviceKey();
  if (!key) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        Prefer: 'count=exact',
        Range: '0-0',
      },
    });
    if (!response.ok && response.status !== 206) return null;
    const range = response.headers.get('content-range');
    if (!range) return null;
    const total = range.split('/')[1];
    const parsed = total ? Number.parseInt(total, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface AgentHealthRow {
  /** Plain agent name as stored — never a slug/id; shown as-is on the board. */
  name: string;
  chip: RosterHealthChip;
  chipClass: string;
  /** Plain-English one-liner — what the agent does / last did. */
  summary: string | null;
  lastSeen: string | undefined;
  openTickets: number;
}

export interface AgentHealthBoard {
  generatedAt: string;
  rows: AgentHealthRow[];
  totals: {
    prsWaitingReview: number | null;
    ticketsFinishedToday: number | null;
    openTickets: number | null;
    costThisWeekUsd: number | null;
  };
  readable: boolean;
}

export async function loadAgentHealthBoard(): Promise<AgentHealthBoard> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [routineRows, presenceRows, dispatchRows, prsWaiting, finishedToday, openTickets, costRows] =
    await Promise.all([
      readOrEmpty(
        'nvg_agent_routines',
        'select=agent_name,function_summary,active,health_status,retired_at&order=agent_name.asc'
      ),
      readOrEmpty('nvg_agent_presence', 'select=agent_name,last_seen_at'),
      readOrEmpty(
        'agent_dispatch',
        'status=not.in.(done,rejected,skipped)&select=owner,status&limit=2000'
      ),
      countRows('agent_dispatch', `owner=eq.COUNCIL&status=eq.queued&select=status`),
      countRows(
        'agent_dispatch',
        `status=eq.done&updated_at=gte.${todayStart.toISOString()}&select=status`
      ),
      countRows('agent_dispatch', 'status=not.in.(done,rejected,skipped)&select=status'),
      readOrEmpty('axon_cost_ledger', `called_at=gte.${weekAgo}&select=cost_usd`),
    ]);

  const readable = routineRows.length > 0 || presenceRows.length > 0;

  const lastSeenByAgent = new Map<string, string>();
  for (const row of presenceRows) {
    const name = typeof row.agent_name === 'string' ? row.agent_name : null;
    const seen = typeof row.last_seen_at === 'string' ? row.last_seen_at : null;
    if (!name || !seen) continue;
    const existing = lastSeenByAgent.get(name);
    if (!existing || new Date(seen) > new Date(existing)) lastSeenByAgent.set(name, seen);
  }

  const openTicketsByOwner = new Map<string, number>();
  for (const row of dispatchRows) {
    const owner = typeof row.owner === 'string' ? row.owner : 'Unassigned';
    openTicketsByOwner.set(owner, (openTicketsByOwner.get(owner) ?? 0) + 1);
  }

  const rows: AgentHealthRow[] = routineRows
    .filter((r) => !r.retired_at)
    .map((r) => {
      const name = typeof r.agent_name === 'string' ? r.agent_name : 'Unnamed agent';
      const healthStatus = typeof r.health_status === 'string' ? r.health_status : null;
      const lastSeen = lastSeenByAgent.get(name);
      const active = r.active !== false;
      const chip: RosterHealthChip = active
        ? rosterHealthChip(healthStatus, null, lastSeen ?? null)
        : 'Stale';
      return {
        name,
        chip,
        chipClass: rosterHealthChipClass(chip),
        summary: typeof r.function_summary === 'string' ? r.function_summary : null,
        lastSeen: plainRelativeTime(lastSeen ?? null),
        openTickets: openTicketsByOwner.get(name) ?? 0,
      };
    });

  const costThisWeekUsd = costRows.length
    ? costRows.reduce((sum, r) => {
        const v = typeof r.cost_usd === 'number' ? r.cost_usd : Number(r.cost_usd ?? 0);
        return sum + (Number.isFinite(v) ? v : 0);
      }, 0)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    rows,
    totals: {
      prsWaitingReview: prsWaiting,
      ticketsFinishedToday: finishedToday,
      openTickets,
      costThisWeekUsd,
    },
    readable,
  };
}
