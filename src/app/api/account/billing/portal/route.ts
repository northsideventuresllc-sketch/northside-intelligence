import { NextResponse } from "next/server";
import { billingStripe } from "@/lib/billing/stripe";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://northsideintelligence.com";
}

export async function POST() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = await getUserBillingState(user.id);
  if (!state.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const session = await billingStripe.billingPortal.sessions.create({
    customer: state.stripeCustomerId,
    return_url: `${appUrl()}/account`,
  });

  return NextResponse.json({ url: session.url });
}
