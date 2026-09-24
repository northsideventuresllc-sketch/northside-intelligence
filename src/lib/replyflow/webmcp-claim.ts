import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureReplyflowBillingEnvHydrated, getBillingConfigError, getPlanFromPriceId, stripe } from "@/lib/replyflow/stripe";

/** Sign-in must never wait longer than this for the Stripe claim to resolve. */
const STRIPE_CLAIM_TIMEOUT_MS = 1500;

/**
 * True once this account already has a linked Stripe subscription — nothing left to claim.
 */
async function alreadyHasStripeSubscription(admin: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data } = await admin
      .from("replyflow_profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();
    return Boolean(data?.stripe_subscription_id);
  } catch (err) {
    console.warn("[replyflow] webmcp claim: profile lookup failed:", (err as Error).message);
    // Can't tell either way — don't block the Stripe check on an unrelated read failure.
    return false;
  }
}

/**
 * Cheap evidence check (no Stripe call): did this email ever run the WebMCP ReplyFlow
 * subscribe tool? Read from the WebMCP ingress audit log (src/lib/webmcp/ingress-log.ts),
 * which records every call as an axon_agent_messages row: thread='webmcp_ingress',
 * meta.tool_name='ni_replyflow_subscribe', meta.parameters.account_email=<email used>.
 * If the check itself fails, fail open (return true) so the Stripe claim still runs rather
 * than silently going blind to a real agent purchase.
 */
async function hasWebmcpSubscribeEvidence(admin: SupabaseClient, email: string): Promise<boolean> {
  try {
    const { data, error } = await admin
      .from("axon_agent_messages")
      .select("id")
      .eq("thread", "webmcp_ingress")
      .eq("meta->>tool_name", "ni_replyflow_subscribe")
      .ilike("meta->parameters->>account_email", email)
      .limit(1)
      .maybeSingle();
    if (error) return true;
    return Boolean(data);
  } catch (err) {
    console.warn("[replyflow] webmcp claim: ingress log check failed:", (err as Error).message);
    return true;
  }
}

async function runStripeClaim(admin: SupabaseClient, userId: string, email: string): Promise<boolean> {
  await ensureReplyflowBillingEnvHydrated();
  if (getBillingConfigError()) return false;

  const customers = await stripe.customers.list({ email, limit: 10 }, { timeout: STRIPE_CLAIM_TIMEOUT_MS });
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list(
      { customer: customer.id, status: "active", limit: 10 },
      { timeout: STRIPE_CLAIM_TIMEOUT_MS }
    );
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
  return false;
}

/**
 * Links a ReplyFlow subscription bought through the agent storefront (WebMCP) to the portal
 * account with the same email. Agent buyers pay as guests, so the Stripe session has no userId;
 * this runs on sign-in/sign-up and from the ReplyFlow webhook. Never throws — a failure here must
 * not block sign-in.
 *
 * Stripe is only called when it can matter: skipped entirely when this account already has a
 * linked subscription, or when there is no evidence in the WebMCP ingress log that this email
 * ever ran the ReplyFlow subscribe tool. When it does run, it is capped to
 * STRIPE_CLAIM_TIMEOUT_MS so sign-in is never blocked on Stripe — a timeout just returns false;
 * the ReplyFlow webhook and the next sign-in still get a chance to link it.
 */
export async function claimWebmcpReplyflowSubscription(
  admin: SupabaseClient,
  userId: string,
  email: string
): Promise<boolean> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const [alreadyLinked, hasEvidence] = await Promise.all([
      alreadyHasStripeSubscription(admin, userId),
      hasWebmcpSubscribeEvidence(admin, normalizedEmail),
    ]);
    if (alreadyLinked || !hasEvidence) return false;

    // Stripe SDK v14's RequestOptions has no `signal`, so per-call `timeout` above caps each
    // individual request; this race is the hard backstop that caps the whole claim so sign-in
    // is never held up even if a request doesn't respect its own timeout.
    const claimPromise = runStripeClaim(admin, userId, normalizedEmail);
    const timeoutPromise = new Promise<false>((resolve) => {
      setTimeout(() => resolve(false), STRIPE_CLAIM_TIMEOUT_MS);
    });

    return await Promise.race([claimPromise, timeoutPromise]);
  } catch (err) {
    console.warn("[replyflow] webmcp subscription claim skipped:", (err as Error).message);
    return false;
  }
}
