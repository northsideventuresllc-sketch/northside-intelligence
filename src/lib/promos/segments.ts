import "server-only";

import { normalizeNiTier, type NiTier } from "@/lib/billing/ni-tiers";
import { createServiceClient } from "@/lib/supabase/server";

const TIER_RANK: Record<NiTier, number> = {
  free: 0,
  core: 1,
  pro: 2,
  power: 3,
};

interface UserSignals {
  userId: string;
  tier: NiTier;
  storeOrderCount: number;
  toolSessionCount30d: number;
  paidMonths: number;
  ownedToolSlugs: string[];
}

interface SegmentRow {
  id: string;
  slug: string;
  criteria: Record<string, unknown>;
  priority: number;
}

async function loadUserSignals(userId: string): Promise<UserSignals> {
  const admin = createServiceClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [subRes, toolkitRes, storeRes, sessionsRes] = await Promise.all([
    admin.from("ni_subscriptions").select("tier, created_at").eq("id", userId).maybeSingle(),
    admin.from("ni_toolkit").select("tool_slug, access_type, purchased_at").eq("user_id", userId),
    admin
      .from("ni_store_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("replyflow_replies")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since30d),
  ]);

  const tier = normalizeNiTier(subRes.data?.tier);
  const toolkit = toolkitRes.data ?? [];
  const paidEntries = toolkit.filter(
    (t) => t.access_type !== "free" && t.purchased_at
  );

  // Estimate paid months from earliest paid purchase
  let paidMonths = 0;
  if (paidEntries.length > 0) {
    const earliest = paidEntries
      .map((t) => new Date(String(t.purchased_at)).getTime())
      .sort((a, b) => a - b)[0];
    paidMonths = Math.max(1, Math.floor((Date.now() - earliest) / (30 * 24 * 60 * 60 * 1000)));
  }
  if (tier !== "free") {
    paidMonths = Math.max(paidMonths, 1);
  }

  // Aggregate tool sessions across sector3 session tables
  const sessionTables = [
    "grantbot_sessions",
    "signaldesk_sessions",
    "gapscan_sessions",
    "bridgeai_sessions",
  ] as const;

  let toolSessionCount30d = sessionsRes.count ?? 0;
  for (const table of sessionTables) {
    const { count } = await admin
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since30d);
    toolSessionCount30d += count ?? 0;
  }

  return {
    userId,
    tier,
    storeOrderCount: storeRes.count ?? 0,
    toolSessionCount30d,
    paidMonths,
    ownedToolSlugs: toolkit.map((t) => String(t.tool_slug)),
  };
}

function matchesSegment(signals: UserSignals, criteria: Record<string, unknown>): boolean {
  const minTier = criteria.min_tier as string | undefined;
  if (minTier && TIER_RANK[signals.tier] < TIER_RANK[normalizeNiTier(minTier)]) {
    return false;
  }

  const exactTier = criteria.tier as string | undefined;
  if (exactTier && signals.tier !== normalizeNiTier(exactTier)) {
    return false;
  }

  const minSessions = criteria.min_sessions_30d as number | undefined;
  if (minSessions != null && signals.toolSessionCount30d < minSessions) return false;

  const maxSessions = criteria.max_sessions_30d as number | undefined;
  if (maxSessions != null && signals.toolSessionCount30d > maxSessions) return false;

  const minStoreOrders = criteria.min_store_orders as number | undefined;
  if (minStoreOrders != null && signals.storeOrderCount < minStoreOrders) return false;

  const minPaidMonths = criteria.min_paid_months as number | undefined;
  if (minPaidMonths != null && signals.paidMonths < minPaidMonths) return false;

  const maxPaidMonths = criteria.max_paid_months as number | undefined;
  if (maxPaidMonths != null && signals.paidMonths > maxPaidMonths) return false;

  const minToolSessions = criteria.min_tool_sessions_30d as number | undefined;
  if (minToolSessions != null && signals.toolSessionCount30d < minToolSessions) return false;

  return true;
}

/** Recalculate backend segment assignments for all users (cron). */
export async function recalculateAllUserSegments(): Promise<{
  usersProcessed: number;
  assignmentsWritten: number;
}> {
  const admin = createServiceClient();

  const { data: segments } = await admin
    .from("ni_promo_segments")
    .select("id, slug, criteria, priority")
    .eq("active", true)
    .order("priority", { ascending: false });

  if (!segments?.length) return { usersProcessed: 0, assignmentsWritten: 0 };

  const { data: profiles } = await admin.from("ni_portal_profiles").select("id");
  let assignmentsWritten = 0;

  for (const profile of profiles ?? []) {
    const signals = await loadUserSignals(profile.id);
    const matched: Array<{ segmentId: string; snapshot: Record<string, unknown> }> = [];

    for (const seg of segments as SegmentRow[]) {
      const criteria = (seg.criteria ?? {}) as Record<string, unknown>;
      if (matchesSegment(signals, criteria)) {
        matched.push({
          segmentId: seg.id,
          snapshot: {
            tier: signals.tier,
            storeOrderCount: signals.storeOrderCount,
            toolSessionCount30d: signals.toolSessionCount30d,
            paidMonths: signals.paidMonths,
          },
        });
      }
    }

    await admin.from("ni_user_segment_assignments").delete().eq("user_id", profile.id);

    if (matched.length > 0) {
      const now = new Date().toISOString();
      const rows = matched.map((m) => ({
        user_id: profile.id,
        segment_id: m.segmentId,
        score_snapshot: m.snapshot,
        assigned_at: now,
      }));
      await admin.from("ni_user_segment_assignments").insert(rows);
      assignmentsWritten += rows.length;
    }
  }

  return { usersProcessed: profiles?.length ?? 0, assignmentsWritten };
}

export async function getUserSegmentSlugs(userId: string): Promise<string[]> {
  const admin = createServiceClient();
  const { data: assignments } = await admin
    .from("ni_user_segment_assignments")
    .select("segment_id")
    .eq("user_id", userId);

  const segmentIds = (assignments ?? []).map((a) => a.segment_id);
  if (segmentIds.length === 0) return [];

  const { data: segments } = await admin
    .from("ni_promo_segments")
    .select("slug")
    .in("id", segmentIds);

  return (segments ?? []).map((s) => String(s.slug));
}

export { loadUserSignals };
