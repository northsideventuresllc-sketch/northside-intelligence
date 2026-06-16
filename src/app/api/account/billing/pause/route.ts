import { NextRequest, NextResponse } from "next/server";
import { getPausableSubscriptionId } from "@/lib/billing/subscription-actions";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { billingStripe, ensureBillingEnvHydrated, getBillingConfigError } from "@/lib/billing/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface PauseBody {
  context?: "portal" | "tool";
  toolSlug?: string;
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

  let body: PauseBody = {};
  try {
    body = (await req.json()) as PauseBody;
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
    return NextResponse.json({ error: "No active subscription to pause" }, { status: 400 });
  }

  try {
    await billingStripe.subscriptions.update(subscriptionId, {
      pause_collection: { behavior: "mark_uncollectible" },
    });
    return NextResponse.json({
      message: "Subscription paused. You can resume or cancel from Account Settings.",
    });
  } catch (err) {
    console.error("[billing/pause]", err);
    return NextResponse.json(
      { error: "Unable to pause subscription. Please try again." },
      { status: 500 }
    );
  }
}
