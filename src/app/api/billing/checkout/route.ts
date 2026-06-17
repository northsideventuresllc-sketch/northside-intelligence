import { NextRequest, NextResponse } from "next/server";
import type { BillingInterval, NiTier } from "@/lib/billing/ni-tiers";
import { PAID_NI_TIERS } from "@/lib/billing/ni-tiers";
import {
  getUserBillingState,
  userOwnsTool,
  userHasUnlimitedToolAccess,
  canAddNiPlanTool,
} from "@/lib/billing/entitlements";
import { getLifetimeLaunchStatus } from "@/lib/billing/lifetime-launch";
import { shouldShowPermanentAccessOffer } from "@/lib/billing/permanent-access-offer";
import {
  billingStripe,
  ensureBillingEnvHydrated,
  getBillingConfigError,
  getNiSubscriptionPriceId,
  getToolPriceIdFromDb,
  mapNiPlanPricing,
  type CheckoutKind,
} from "@/lib/billing/stripe";
import { mapDbPricing } from "@/lib/billing/tool-pricing";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://northsideintelligence.com";
}

function parseCheckoutBody(body: Record<string, unknown>): CheckoutKind | null {
  const type = body.type as string | undefined;
  if (type === "ni_subscription") {
    const tier = body.tier as NiTier;
    const interval = body.interval as BillingInterval;
    if (!PAID_NI_TIERS.includes(tier) || (interval !== "monthly" && interval !== "annual")) {
      return null;
    }
    return { type: "ni_subscription", tier, interval };
  }
  if (type === "tool_subscription") {
    const toolSlug = body.toolSlug as string;
    const interval = body.interval as BillingInterval;
    if (!toolSlug || (interval !== "monthly" && interval !== "annual")) return null;
    return { type: "tool_subscription", toolSlug, interval };
  }
  if (type === "tool_lifetime") {
    const toolSlug = body.toolSlug as string;
    if (!toolSlug) return null;
    return { type: "tool_lifetime", toolSlug };
  }
  return null;
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

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const checkout = parseCheckoutBody(body);
  if (!checkout) return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });

  try {
    const base = appUrl();
    const state = await getUserBillingState(user.id);
    const service = createServiceClient();
    const { data: niPlanRows } = await service.from("ni_plan_pricing").select("*");
    const niPlanPricing = (niPlanRows ?? []).map(mapNiPlanPricing);

    let priceId: string | null = null;
    let mode: "subscription" | "payment" = "subscription";
    let successUrl = `${base}/toolkit?checkout=success`;
    let cancelUrl = `${base}/#pricing`;
    const metadata: Record<string, string> = { userId: user.id, checkoutType: checkout.type };

    if (checkout.type === "ni_subscription") {
      priceId = getNiSubscriptionPriceId(checkout.tier, checkout.interval, niPlanPricing);
      metadata.niTier = checkout.tier;
      metadata.billingInterval = checkout.interval;
      successUrl = `${base}/toolkit?upgraded=${checkout.tier}`;
      cancelUrl = `${base}/#pricing`;
    } else {
      const { data: row } = await service
        .from("ni_tool_pricing")
        .select("*")
        .eq("tool_slug", checkout.toolSlug)
        .maybeSingle();

      if (!row) return NextResponse.json({ error: "Tool pricing not found" }, { status: 404 });
      const pricing = mapDbPricing(row);

      if (userOwnsTool(state, checkout.toolSlug)) {
        if (userHasUnlimitedToolAccess(state, checkout.toolSlug)) {
          return NextResponse.json({ error: "You already have unlimited access to this tool" }, { status: 400 });
        }
        if (checkout.type !== "tool_subscription") {
          return NextResponse.json({ error: "You already own this tool" }, { status: 400 });
        }
      }

      if (checkout.type === "tool_lifetime") {
        const lifetimeStatus = await getLifetimeLaunchStatus();
        const randomOffer = shouldShowPermanentAccessOffer(checkout.toolSlug, user.id);
        if (!lifetimeStatus.active && !randomOffer) {
          return NextResponse.json(
            { error: lifetimeStatus.active ? lifetimeStatus.reason : "Permanent access is not available right now" },
            { status: 403 }
          );
        }

        priceId = getToolPriceIdFromDb(pricing, "lifetime");
        mode = "payment";
        metadata.toolSlug = checkout.toolSlug;
        metadata.accessType = "lifetime";
        successUrl = `${base}/toolkit?purchased=${checkout.toolSlug}`;
        cancelUrl = `${base}/tools/${checkout.toolSlug}`;
      } else {
        if (
          state.hasNiPaidPlan &&
          canAddNiPlanTool(state) &&
          !userHasUnlimitedToolAccess(state, checkout.toolSlug)
        ) {
          return NextResponse.json(
            { error: "Assign unlimited access from your Toolkit under your NI plan" },
            { status: 400 }
          );
        }
        priceId = getToolPriceIdFromDb(pricing, checkout.interval);
        metadata.toolSlug = checkout.toolSlug;
        metadata.accessType = "tool_subscription";
        metadata.billingInterval = checkout.interval;
        successUrl = `${base}/toolkit?purchased=${checkout.toolSlug}`;
        cancelUrl = `${base}/tools/${checkout.toolSlug}`;
      }
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured. Run scripts/setup-stripe-products.ts" },
        { status: 503 }
      );
    }

    const session = await billingStripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email ?? undefined,
      metadata,
      ...(mode === "subscription"
        ? { subscription_data: { metadata: { userId: user.id, ...metadata } } }
        : {}),
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session unavailable" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
