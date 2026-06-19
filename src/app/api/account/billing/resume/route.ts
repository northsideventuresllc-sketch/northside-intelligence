import { NextResponse } from "next/server";
import { getPausableSubscriptionId } from "@/lib/billing/subscription-actions";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { billingStripe, ensureBillingEnvHydrated, getBillingConfigError } from "@/lib/billing/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST() {
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

  const state = await getUserBillingState(user.id);
  const subscriptionId = getPausableSubscriptionId(state, "portal");

  if (!subscriptionId) {
    return NextResponse.json({ error: "No paused subscription to resume" }, { status: 400 });
  }

  try {
    const sub = await billingStripe.subscriptions.retrieve(subscriptionId);
    if (!sub.pause_collection) {
      return NextResponse.json({ error: "Subscription is not paused" }, { status: 400 });
    }

    await billingStripe.subscriptions.update(subscriptionId, {
      pause_collection: "",
    });
    return NextResponse.json({ message: "Subscription resumed." });
  } catch (err) {
    console.error("[billing/resume]", err);
    return NextResponse.json(
      { error: "Unable to resume subscription. Please try again." },
      { status: 500 }
    );
  }
}
