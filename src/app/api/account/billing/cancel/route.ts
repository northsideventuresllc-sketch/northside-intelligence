import { NextRequest, NextResponse } from "next/server";
import { getPausableSubscriptionId } from "@/lib/billing/subscription-actions";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { billingStripe, ensureBillingEnvHydrated, getBillingConfigError } from "@/lib/billing/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface CancelBody {
  context?: "portal" | "tool";
  toolSlug?: string;
  immediate?: boolean;
}

export async function POST(req: NextRequest) {
  await ensureBillingEnvHydrated();
  const billingConfigError = getBillingConfigError();
  if (billingConfigError) {
    return NextResponse.json({ error: billingConfigError }, { status: 503 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: CancelBody = {};
  try {
    body = (await req.json()) as CancelBody;
  } catch {
    // default context portal
  }

  const state = await getUserBillingState(user.id);
  const subscriptionId = getPausableSubscriptionId(
    state,
    body.context ?? "portal",
    body.toolSlug
  );

  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
  }

  try {
    if (body.immediate) {
      await billingStripe.subscriptions.cancel(subscriptionId);
      return NextResponse.json({ message: "Subscription canceled immediately." });
    }

    await billingStripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return NextResponse.json({
      message: "Subscription will cancel at the end of your current billing period.",
    });
  } catch (err) {
    console.error("[billing/cancel]", err);
    return NextResponse.json(
      { error: "Unable to cancel subscription. Please try again." },
      { status: 500 }
    );
  }
}
