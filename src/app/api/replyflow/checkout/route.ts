import { NextRequest, NextResponse } from "next/server";
import { replyflowAppUrl } from "@/lib/replyflow/auth";
import { stripe } from "@/lib/replyflow/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const PRICE_IDS: Record<string, string | undefined> = {
  solo: process.env.STRIPE_SOLO_PRICE_ID,
  team: process.env.STRIPE_TEAM_PRICE_ID,
  agency: process.env.STRIPE_AGENCY_PRICE_ID,
};

export async function POST(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  const priceId = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

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

  return NextResponse.json({ url: session.url });
}
