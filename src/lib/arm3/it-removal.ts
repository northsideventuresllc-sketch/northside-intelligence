import "server-only";

import { isMasterAccountFlag } from "@/lib/billing/master-account";
import {
  billingStripe,
  ensureBillingEnvHydrated,
  getBillingConfigError,
} from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export interface SubscriberCutoffResult {
  scheduled: number;
  canceledAtPeriodEnd: number;
  revokedImmediate: number;
  errors: string[];
}

/**
 * On REMOVE: keep paying subscribers until end of their Stripe billing period,
 * then let expire_ni_entitlements revoke toolkit access. Lifetime/free entries
 * are cut off immediately (not subscription-cycle based).
 */
export async function scheduleSubscriberCutoff(
  toolSlug: string
): Promise<SubscriberCutoffResult> {
  const supabase = createServiceClient();
  const result: SubscriberCutoffResult = {
    scheduled: 0,
    canceledAtPeriodEnd: 0,
    revokedImmediate: 0,
    errors: [],
  };

  const { data: rows, error } = await supabase
    .from("ni_toolkit")
    .select("id, user_id, access_type, expires_at, stripe_subscription_id")
    .eq("tool_slug", toolSlug);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  if (!rows?.length) return result;

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
    supabase
      .from("ni_portal_profiles")
      .select("id, is_master_account")
      .in("id", userIds),
    supabase
      .from("ni_subscriptions")
      .select("id, current_period_end, stripe_subscription_id")
      .in("id", userIds),
  ]);

  const masterIds = new Set(
    (profiles ?? [])
      .filter((p) => isMasterAccountFlag(p.is_master_account))
      .map((p) => p.id)
  );
  const periodByUser = new Map(
    (subscriptions ?? []).map((s) => [s.id, s.current_period_end as string | null])
  );

  let stripeReady = false;
  try {
    await ensureBillingEnvHydrated();
    stripeReady = !getBillingConfigError();
  } catch {
    stripeReady = false;
  }

  const now = new Date().toISOString();

  for (const row of rows) {
    if (masterIds.has(row.user_id)) continue;

    const accessType = String(row.access_type);
    const stripeSubId =
      typeof row.stripe_subscription_id === "string"
        ? row.stripe_subscription_id
        : null;

    if (accessType === "tool_subscription" && stripeSubId && stripeReady) {
      try {
        const sub = await billingStripe.subscriptions.retrieve(stripeSubId);
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

        if (!sub.cancel_at_period_end) {
          await billingStripe.subscriptions.update(stripeSubId, {
            cancel_at_period_end: true,
          });
          result.canceledAtPeriodEnd += 1;
        }

        await supabase
          .from("ni_toolkit")
          .update({ expires_at: periodEnd, updated_at: now })
          .eq("id", row.id);

        result.scheduled += 1;
        continue;
      } catch (err) {
        result.errors.push(
          `${stripeSubId}: ${err instanceof Error ? err.message : "stripe_failed"}`
        );
      }
    }

    if (accessType === "tool_subscription" || accessType === "ni_plan") {
      // Prefer explicit billing period; never default to "now" (would cut off mid-cycle).
      const periodEnd =
        periodByUser.get(row.user_id) ||
        row.expires_at ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("ni_toolkit")
        .update({ expires_at: periodEnd, updated_at: now })
        .eq("id", row.id);
      result.scheduled += 1;
      continue;
    }

    // free / lifetime — no billing cycle; cut off now
    await supabase.from("ni_toolkit").delete().eq("id", row.id);
    result.revokedImmediate += 1;
  }

  return result;
}
