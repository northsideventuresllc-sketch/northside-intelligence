import type { AgentHealthColor } from "@/lib/axon/plain-labels";

const TERMINAL_TICKET = new Set([
  "done",
  "skipped",
  "rejected",
  "cancelled",
  "canceled",
  "merged",
  "complete",
  "completed",
  "closed",
]);

export interface AgentPresenceRow {
  agent_name: string;
  status?: string | null;
  last_seen_at?: string | null;
  last_action?: string | null;
}

export interface DispatchRow {
  owner?: string | null;
  status?: string | null;
}

export interface PrReviewRow {
  verdict?: string | null;
  reviewed_at?: string | null;
}

export interface CostLedgerRow {
  cost_usd?: number | string | null;
  called_at?: string | null;
}

export interface AgentHealthRow {
  agent: string;
  color: AgentHealthColor;
  lastAction: string;
  openTickets: number;
}

export interface HealthDashboardTotals {
  prsWaitingReview: number;
  mergesToday: number;
  costThisWeekUsd: number;
}

export interface HealthDashboard {
  generatedAt: string;
  agents: AgentHealthRow[];
  totals: HealthDashboardTotals;
}

const HOUR = 3600e3;
const DAY = 24 * HOUR;

/**
 * FRONTIER-09-JB-HEALTH-DASHBOARD lane 1: an agent's traffic-light color from
 * its last successful check-in. Pure -- no I/O -- so it is directly
 * unit-testable without a database. < 1h = green, < 24h = yellow, else red.
 * A presence row that itself reports an error status is always red,
 * regardless of how recent it is -- a fast, broken check-in is not "fine".
 */
export function computeAgentHealth(
  row: AgentPresenceRow,
  now: Date = new Date(),
): AgentHealthColor {
  const status = (row.status || "").toLowerCase();
  if (status === "error" || status === "failed" || status === "down") return "red";
  if (!row.last_seen_at) return "red";
  const age = now.getTime() - new Date(row.last_seen_at).getTime();
  if (!Number.isFinite(age) || age < 0) return "red";
  if (age < HOUR) return "green";
  if (age < DAY) return "yellow";
  return "red";
}

/** Lane 2: open (non-terminal) ticket count for one agent. Pure. */
export function openTicketsForAgent(dispatch: DispatchRow[], agentName: string): number {
  const name = (agentName || "").toLowerCase();
  return (dispatch || []).filter(
    (t) =>
      (t.owner || "").toLowerCase() === name &&
      !TERMINAL_TICKET.has((t.status || "").toLowerCase()),
  ).length;
}

/** Lane 3: total open tickets across every agent. Pure. */
export function totalOpenTickets(dispatch: DispatchRow[]): number {
  return (dispatch || []).filter((t) => !TERMINAL_TICKET.has((t.status || "").toLowerCase())).length;
}

/** Lane 4: PRs with a recorded council verdict that isn't a pass yet (still waiting). Pure. */
export function prsWaitingReview(reviews: PrReviewRow[]): number {
  return (reviews || []).filter((r) => (r.verdict || "").toLowerCase() !== "pass").length;
}

/** Lane 5: PRs COUNCIL passed today (UTC calendar day of `now`). Pure. */
export function mergesToday(reviews: PrReviewRow[], now: Date = new Date()): number {
  const todayKey = now.toISOString().slice(0, 10);
  return (reviews || []).filter(
    (r) => (r.verdict || "").toLowerCase() === "pass" && String(r.reviewed_at || "").slice(0, 10) === todayKey,
  ).length;
}

/** Lane 6: total spend in the trailing 7 days. Pure. */
export function costThisWeek(ledger: CostLedgerRow[], now: Date = new Date()): number {
  const weekAgo = now.getTime() - 7 * DAY;
  const total = (ledger || [])
    .filter((r) => r.called_at && new Date(r.called_at).getTime() >= weekAgo)
    .reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Roll everything into one plain-labels-ready report. Pure -- given the raw
 * rows, no network. `plain-labels.ts` (`healthColorLabel`) turns `color` into
 * the words that actually reach the screen; this module never renders text
 * on its own.
 */
export function buildHealthDashboard(
  inputs: {
    presence: AgentPresenceRow[];
    dispatch: DispatchRow[];
    prReviews: PrReviewRow[];
    costLedger: CostLedgerRow[];
  },
  now: Date = new Date(),
): HealthDashboard {
  const agents: AgentHealthRow[] = (inputs.presence || [])
    .map((p) => ({
      agent: p.agent_name,
      color: computeAgentHealth(p, now),
      lastAction: (p.last_action || "").trim() || "No recent activity logged.",
      openTickets: openTicketsForAgent(inputs.dispatch, p.agent_name),
    }))
    .sort((a, b) => a.agent.localeCompare(b.agent));

  return {
    generatedAt: now.toISOString(),
    agents,
    totals: {
      prsWaitingReview: prsWaitingReview(inputs.prReviews),
      mergesToday: mergesToday(inputs.prReviews, now),
      costThisWeekUsd: costThisWeek(inputs.costLedger, now),
    },
  };
}
