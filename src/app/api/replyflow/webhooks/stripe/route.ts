import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPlanFromPriceId, stripe } from "@/lib/replyflow/stripe";
import type { UserPlan } from "@/lib/replyflow/tier";
import { createServiceClient } from "@/lib/supabase/server";

function webhookSecret(): string | undefined {
  return process.env.STRIPE_REPLYFLOW_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
}

async function setProfilePlan(
  supabase: ReturnType<typeof createServiceClient>,
  filter: { column: "id" | "stripe_customer_id"; value: string },
  plan: UserPlan,
  extra?: { stripe_customer_id?: string; stripe_subscription_id?: string | null }
) {
  const payload: Record<string, unknown> = { plan, ...extra };
  if (extra?.stripe_subscription_id === null) payload.stripe_subscription_id = null;

  const { error } = await supabase
    .from("replyflow_profiles")
    .update(payload)
    .eq(filter.column, filter.value);

  if (error) throw new Error(error.message);
}

export async function POST(req: NextRequest) {
  const secret = webhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId || !session.subscription) break;
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const plan = getPlanFromPriceId(sub.items.data[0]?.price.id);
        await setProfilePlan(
          supabase,
          { column: "id", value: userId },
          plan,
          {
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          }
        );
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setProfilePlan(
          supabase,
          { column: "stripe_customer_id", value: sub.customer as string },
          "free",
          { stripe_subscription_id: null }
        );
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        if (sub.status === "active") {
          await setProfilePlan(
            supabase,
            { column: "stripe_customer_id", value: customerId },
            getPlanFromPriceId(sub.items.data[0]?.price.id)
          );
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
          await setProfilePlan(
            supabase,
            { column: "stripe_customer_id", value: customerId },
            "free",
            { stripe_subscription_id: null }
          );
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
