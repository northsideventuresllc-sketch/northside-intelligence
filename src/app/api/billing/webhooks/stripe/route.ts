import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  grantToolkitAccess,
  revokeToolkitTool,
  setNiSubscription,
} from "@/lib/billing/entitlements";
import type { NiTier } from "@/lib/billing/ni-tiers";
import {
  billingStripe,
  getNiTierFromPriceId,
  mapNiPlanPricing,
  resolveToolCheckoutFromPriceId,
} from "@/lib/billing/stripe";
import { mapDbPricing } from "@/lib/billing/tool-pricing";
import { createServiceClient } from "@/lib/supabase/server";

async function loadAllToolPricing() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("ni_tool_pricing").select("*");
  return (data ?? []).map(mapDbPricing);
}

async function loadNiPlanPricing() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("ni_plan_pricing").select("*");
  return (data ?? []).map(mapNiPlanPricing);
}

function periodEndIso(sub: Stripe.Subscription): string {
  return new Date(sub.current_period_end * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = billingStripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const allPricing = await loadAllToolPricing();
  const niPlanPricing = await loadNiPlanPricing();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        const checkoutType = session.metadata?.checkoutType;

        if (checkoutType === "tool_lifetime" && session.metadata?.toolSlug) {
          await grantToolkitAccess({
            userId,
            toolSlug: session.metadata.toolSlug,
            accessType: "lifetime",
          });
          break;
        }

        if (checkoutType === "ni_subscription" && session.subscription) {
          const sub = await billingStripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price.id;
          const mapped = getNiTierFromPriceId(priceId, niPlanPricing);
          if (mapped) {
            await setNiSubscription({
              userId,
              tier: mapped.tier,
              billingInterval: mapped.interval,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              currentPeriodEnd: periodEndIso(sub),
            });
          }
          break;
        }

        if (checkoutType === "tool_subscription" && session.subscription && session.metadata?.toolSlug) {
          const sub = await billingStripe.subscriptions.retrieve(session.subscription as string);
          await grantToolkitAccess({
            userId,
            toolSlug: session.metadata.toolSlug,
            accessType: "tool_subscription",
            expiresAt: periodEndIso(sub),
            stripeSubscriptionId: session.subscription as string,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const priceId = sub.items.data[0]?.price.id;
        const niMapped = getNiTierFromPriceId(priceId, niPlanPricing);
        const toolMapped = resolveToolCheckoutFromPriceId(priceId, allPricing);

        if (sub.status === "active") {
          if (niMapped && userId) {
            await setNiSubscription({
              userId,
              tier: niMapped.tier,
              billingInterval: niMapped.interval,
              stripeCustomerId: sub.customer as string,
              stripeSubscriptionId: sub.id,
              currentPeriodEnd: periodEndIso(sub),
            });
          } else if (toolMapped && userId && toolMapped.interval !== "lifetime") {
            await grantToolkitAccess({
              userId,
              toolSlug: toolMapped.toolSlug,
              accessType: "tool_subscription",
              expiresAt: periodEndIso(sub),
              stripeSubscriptionId: sub.id,
            });
          }
        } else if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "past_due") {
          if (niMapped && userId) {
            await setNiSubscription({
              userId,
              tier: "free" as NiTier,
              billingInterval: null,
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
            });
          } else if (toolMapped && userId) {
            await revokeToolkitTool(userId, toolMapped.toolSlug);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const priceId = sub.items.data[0]?.price.id;
        const niMapped = getNiTierFromPriceId(priceId, niPlanPricing);
        const toolMapped = resolveToolCheckoutFromPriceId(priceId, allPricing);

        if (niMapped && userId) {
          await setNiSubscription({
            userId,
            tier: "free",
            billingInterval: null,
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          });
        } else if (toolMapped && userId) {
          await revokeToolkitTool(userId, toolMapped.toolSlug);
        }
        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
