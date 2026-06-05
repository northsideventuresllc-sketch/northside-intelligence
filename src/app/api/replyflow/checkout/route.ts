import { NextRequest, NextResponse } from "next/server";
import { replyflowAppUrl } from "@/lib/replyflow/auth";
import { callReplyFlowEdge } from "@/lib/replyflow/replyflow-edge";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const PRICE_IDS: Record<string, string | undefined> = {
  solo: process.env.STRIPE_SOLO_PRICE_ID,
  team: process.env.STRIPE_TEAM_PRICE_ID,
  agency: process.env.STRIPE_AGENCY_PRICE_ID,
};

export async function POST(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();
  const priceId = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const appUrl = replyflowAppUrl();
  const result = await callReplyFlowEdge<{ url?: string; error?: string }>(
    "checkout",
    {
      priceId,
      successUrl: `${appUrl}/dashboard?upgraded=true`,
      cancelUrl: `${appUrl}#pricing`,
    },
    { accessToken: session.access_token }
  );

  if (!result.ok || !result.data.url) {
    return NextResponse.json(
      { error: result.data.error ?? "Checkout failed" },
      { status: result.status }
    );
  }

  return NextResponse.json({ url: result.data.url });
}
