import { NextRequest, NextResponse } from "next/server";
import { replyflowAppUrl } from "@/lib/replyflow/auth";
import {
  getBillingConfigError,
  ensureReplyflowBillingEnvHydrated,
  stripe,
  REPLYFLOW_PRICE_IDS,
} from "@/lib/replyflow/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import {
  isSevenDayTrialPromoActive,
  SEVEN_DAY_TRIAL_DAYS,
  SEVEN_DAY_TRIAL_PROMO_META,
} from "@/lib/billing/seven-day-trial-promo";

export async function POST(req: NextRequest) {
  await ensureReplyflowBillingEnvHydrated();
  const billingConfigError = getBillingConfigError();
  if (billingConfigError) {
    return NextResponse.json({ error: billingConfigError }, { status: 503 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let plan: string | undefined;
  try {
    ({ plan } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const resolvedPlan = plan === "core" ? "solo" : plan === "done_with_you" ? "team" : plan;
  const priceId = resolvedPlan ? REPLYFLOW_PRICE_IDS[resolvedPlan as keyof typeof REPLYFLOW_PRICE_IDS] : undefined;
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  try {
    const appUrl = replyflowAppUrl();
    // Workstream 6 — 7-day free-trial promo (through Nov 30, 2026).
    // Server-side date gate: trial_period_days is set only while the promo
    // is active, so the promo stops applying automatically after Nov 30.
    const trialPromoActive = isSevenDayTrialPromoActive();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}#pricing`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        ...(trialPromoActive ? { trialPromo: SEVEN_DAY_TRIAL_PROMO_META } : {}),
      },
      subscription_data: {
        metadata: { userId: user.id },
        ...(trialPromoActive ? { trial_period_days: SEVEN_DAY_TRIAL_DAYS } : {}),
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session unavailable" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[replyflow/checkout]", err);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
