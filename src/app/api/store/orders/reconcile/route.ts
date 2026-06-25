import { NextRequest, NextResponse } from "next/server";
import { ensureStoreEnv } from "@/lib/store/env";
import { ensureStoreStripeEnv } from "@/lib/store/stripe";
import { getStoreOrderById } from "@/lib/store/orders";
import {
  preflightOrderCosts,
  reconcileStoreOrder,
  persistCheckoutPaymentDetails,
} from "@/lib/store/reconcile-order";
import { retrieveCheckoutPaymentDetails } from "@/lib/store/stripe-adjustments";
import { getStoreStripe } from "@/lib/store/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || authHeader !== `Bearer ${secret}`) return false;
  return true;
}

async function backfillStripePaymentDetails(orderId: string): Promise<void> {
  const order = await getStoreOrderById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.stripeCustomerId && order.stripePaymentMethodId) return;

  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("ni_store_orders")
    .select("stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();

  const sessionId = row?.stripe_checkout_session_id
    ? String(row.stripe_checkout_session_id)
    : null;
  if (!sessionId) throw new Error("No checkout session on order");

  const stripe = getStoreStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  await persistCheckoutPaymentDetails(orderId, session);

  const details = await retrieveCheckoutPaymentDetails(session);
  if (!details.customerId || !details.paymentMethodId) {
    throw new Error("Could not retrieve Stripe customer or payment method from checkout session");
  }
}

export async function POST(req: NextRequest) {
  await ensureStoreEnv();
  await ensureStoreStripeEnv();

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    orderId?: string;
    dryRun?: boolean;
    chargeFailureEmailOverride?: string;
    cjProductCostCents?: number;
    cjPostageCents?: number;
    resetReconciliation?: boolean;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  try {
    if (body.resetReconciliation) {
      const supabase = createServiceClient();
      await supabase
        .from("ni_store_orders")
        .update({
          reconciliation_status: "pending",
          reconciliation_adjustment_cents: null,
          reconciliation_completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

    await backfillStripePaymentDetails(orderId);
    const preflight = await preflightOrderCosts(orderId, {
      cjProductCostCents: body.cjProductCostCents,
      cjPostageCents: body.cjPostageCents,
    });

    if (!preflight) {
      return NextResponse.json({ error: "Preflight failed" }, { status: 404 });
    }

    if (body.dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, preflight });
    }

    const result = await reconcileStoreOrder(orderId, {
      cjProductCostCents: body.cjProductCostCents,
      cjPostageCents: body.cjPostageCents,
      chargeFailureEmailOverride: body.chargeFailureEmailOverride?.trim() || undefined,
    });

    return NextResponse.json({
      ok: result.status !== "failed_charge" && !result.error,
      preflight,
      ...result,
    });
  } catch (err) {
    console.error("[store/orders/reconcile]", err);
    const message = err instanceof Error ? err.message : "Reconciliation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
