import { NextRequest, NextResponse } from "next/server";
import { replyflowAppUrl } from "@/lib/replyflow/auth";
import { getBillingConfigError, ensureReplyflowBillingEnvHydrated, stripe } from "@/lib/replyflow/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const PRICE_IDS: Record<string, string | undefined> = {
  solo: process.env.STRIPE_SOLO_PRICE_ID ?? "price_1Te0s8QXb5thRQWgqVQdW8Rl",
  team: process.env.STRIPE_TEAM_PRICE_ID ?? "price_1Te0sBQXb5thRQWgYzuWMxTd",
  agency: process.env.STRIPE_AGENCY_PRICE_ID ?? "price_1Te0sEQXb5thRQWgCiAzrClk",
};

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

  const priceId = plan ? PRICE_IDS[plan] : undefined;
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  try {
    const appUrl = replyflowAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}#pricing`,
      customer_email: user.email,
      metadata: { userId: user.id },
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
