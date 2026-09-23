import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureReplyflowBillingEnvHydrated, getBillingConfigError, getPlanFromPriceId, stripe } from "@/lib/replyflow/stripe";

/**
 * Links a ReplyFlow subscription bought through the agent storefront (WebMCP) to the portal
 * account with the same email. Agent buyers pay as guests, so the Stripe session has no userId;
 * this runs on sign-in/sign-up and from the ReplyFlow webhook. Never throws — a failure here must
 * not block sign-in.
 */
export async function claimWebmcpReplyflowSubscription(
  admin: SupabaseClient,
  userId: string,
  email: string
): Promise<boolean> {
  try {
    await ensureReplyflowBillingEnvHydrated();
    if (getBillingConfigError()) return false;

    const customers = await stripe.customers.list({ email: email.trim().toLowerCase(), limit: 10 });
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 10 });
      const sub = subs.data.find((s) => s.metadata?.source === "webmcp" && s.metadata?.tool === "ni_replyflow_subscribe");
      if (!sub) continue;

      const { error } = await admin
        .from("replyflow_profiles")
        .update({
          plan: getPlanFromPriceId(sub.items.data[0]?.price.id),
          stripe_customer_id: customer.id,
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      return !error;
    }
  } catch (err) {
    console.warn("[replyflow] webmcp subscription claim skipped:", (err as Error).message);
  }
  return false;
}
