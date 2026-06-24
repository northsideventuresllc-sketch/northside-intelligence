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
  ensureBillingEnvHydrated,
  getNiTierFromPriceId,
  mapNiPlanPricing,
  resolveToolCheckoutFromPriceId,
} from "@/lib/billing/stripe";
import { mapDbPricing } from "@/lib/billing/tool-pricing";
import { createNotification } from "@/lib/notifications/service";
import { recordPromoConversion } from "@/lib/promos/email-campaigns";
import { sendServiceInvoiceEmail } from "@/lib/resend";
import { getServiceBySlug } from "@/lib/services/offerings";
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

async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("ni_portal_profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  return data?.email ?? null;
}

export async function POST(req: NextRequest) {
  await ensureBillingEnvHydrated();
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

        if (session.amount_total) {
          await recordPromoConversion(userId, session.amount_total);
        }

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
          break;
        }

        if (session.metadata?.serviceCheckout === "true" && session.metadata?.quoteId) {
          const supabase = createServiceClient();
          const now = new Date().toISOString();
          const quoteId = session.metadata.quoteId;

          await supabase
            .from("ni_service_quotes")
            .update({ status: "paid", updated_at: now })
            .eq("id", quoteId);
          await supabase
            .from("ni_service_requests")
            .update({ status: "accepted", updated_at: now })
            .eq("stripe_session_id", session.id);

          const { data: quote } = await supabase
            .from("ni_service_quotes")
            .select("*")
            .eq("id", quoteId)
            .maybeSingle();

          const customerEmail =
            session.customer_details?.email ?? session.customer_email ?? null;

          if (quote && customerEmail) {
            const service = getServiceBySlug(quote.service_slug);
            const intake = (quote.intake_payload ?? {}) as {
              contactName?: string;
              email?: string;
            };
            const lineItems = Array.isArray(quote.line_items)
              ? (quote.line_items as { label: string; amountCents: number }[])
              : [];

            const totalPriceCents = parseInt(
              session.metadata.totalPriceCents ?? String(quote.current_price_cents),
              10
            );
            const amountPaidCents = session.amount_total ?? totalPriceCents;
            const paymentType = session.metadata.paymentType ?? "full";
            const planMonths = parseInt(session.metadata.planMonths ?? "1", 10);

            const invoiceNumber = `NI-${quoteId.slice(0, 8).toUpperCase()}`;

            await sendServiceInvoiceEmail({
              to: customerEmail,
              customerName: intake.contactName?.trim() || "Valued Client",
              serviceName: service?.name ?? quote.service_slug,
              invoiceNumber,
              amountPaidCents,
              totalPriceCents,
              paymentType,
              planMonths,
              lineItems,
              paidAt: now,
            });
          }
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
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
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
        } else if (sub.status === "past_due") {
          const graceEnd = new Date(sub.current_period_end * 1000 + 48 * 60 * 60 * 1000);
          if (userId) {
            const email = await getUserEmail(userId);
            await createNotification({
              userId,
              category: "billing",
              title: "Billing Payment Failed",
              body: "We could not process your latest payment. Update your billing details to avoid service interruption.",
              link: "/account/billing",
              userEmail: email,
            });
          }
          if (niMapped && userId) {
            await setNiSubscription({
              userId,
              tier: niMapped.tier,
              billingInterval: niMapped.interval,
              stripeCustomerId: sub.customer as string,
              stripeSubscriptionId: sub.id,
              currentPeriodEnd: graceEnd.toISOString(),
            });
          } else if (toolMapped && userId && toolMapped.interval !== "lifetime") {
            await grantToolkitAccess({
              userId,
              toolSlug: toolMapped.toolSlug,
              accessType: "tool_subscription",
              expiresAt: graceEnd.toISOString(),
              stripeSubscriptionId: sub.id,
            });
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
