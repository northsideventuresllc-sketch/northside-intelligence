import { NextResponse } from "next/server";
import { stripe } from "@/lib/replyflow/stripe";
import { replyflowAppUrl } from "@/lib/replyflow/auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("replyflow_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found. Upgrade a plan first." },
      { status: 400 }
    );
  }

  const appUrl = replyflowAppUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
