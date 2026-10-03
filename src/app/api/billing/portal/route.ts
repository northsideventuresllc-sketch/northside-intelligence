import { NextRequest, NextResponse } from "next/server";
import { billingStripe, ensureBillingEnvHydrated, getBillingConfigError } from "@/lib/billing/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getUserBillingState } from "@/lib/billing/entitlements";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://northsideintelligence.com";
}

export async function POST(req: NextRequest) {
  try {
    await ensureBillingEnvHydrated();
    const billingConfigError = getBillingConfigError();
    if (billingConfigError) {
      return NextResponse.json({ error: billingConfigError }, { status: 503 });
    }

    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const billingState = await getUserBillingState(user.id);
    let stripeCustomerId = billingState.stripeCustomerId;

    if (!stripeCustomerId) {
      // Check tool profiles (gapscan, bridgeai, signaldesk, etc.)
      const { data: profile } = await supabase
        .from("ni_portal_profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle();

      stripeCustomerId = profile?.stripe_customer_id ?? null;
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No active Stripe customer found. You are currently on the Free tier." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const returnPath = typeof body.returnUrl === "string" ? body.returnUrl : "/dashboard";
    const returnUrl = returnPath.startsWith("http") ? returnPath : `${appUrl()}${returnPath}`;

    const portalSession = await billingStripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create portal session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
