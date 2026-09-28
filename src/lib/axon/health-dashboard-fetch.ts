import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  buildHealthDashboard,
  type AgentPresenceRow,
  type DispatchRow,
  type PrReviewRow,
  type CostLedgerRow,
  type HealthDashboard,
} from "@/lib/axon/health-dashboard";

const DAY = 24 * 3600e3;

/** Server-only live fetch. The page calls this; tests exercise buildHealthDashboard directly (pure, no I/O). */
export async function fetchHealthDashboard(): Promise<HealthDashboard> {
  const supabase = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();

  const [presenceRes, dispatchRes, reviewsRes, ledgerRes] = await Promise.all([
    supabase.from("nvg_agent_presence").select("agent_name,status,last_seen_at,last_action"),
    supabase.from("agent_dispatch").select("owner,status"),
    supabase.from("nvg_pr_council_reviews").select("verdict,reviewed_at").gte("reviewed_at", weekAgo),
    supabase.from("axon_cost_ledger").select("cost_usd,called_at").gte("called_at", weekAgo),
  ]);

  return buildHealthDashboard({
    presence: (presenceRes.data as AgentPresenceRow[]) || [],
    dispatch: (dispatchRes.data as DispatchRow[]) || [],
    prReviews: (reviewsRes.data as PrReviewRow[]) || [],
    costLedger: (ledgerRes.data as CostLedgerRow[]) || [],
  });
}
