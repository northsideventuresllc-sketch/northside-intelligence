import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ensureBillingEnvHydrated, getBillingStripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getServiceBySlug } from "@/lib/services/offerings";
import { BNPL_MAX_CENTS, BNPL_MIN_CENTS } from "@/lib/services/market-rates";
import { formatCents } from "@/lib/services/pricing-engine";
import { DEPOSIT_META, balanceCentsFor, depositCentsForTotal, depositSessionParams } from "@/lib/services/deposit";

interface CheckoutBody {
  quoteId: string;
  paymentType: "full" | "plan" | "bnpl" | "deposit";
  planMonths?: number;
}

function portalAppUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (base?.startsWith("http")) return base.replace(/\/$/, "");
  if (base) return `https://${base}`;
  return "https://www.northsideintelligence.com";
}

export async function POST(request: NextRequest) {
  await ensureBillingEnvHydrated();

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.quoteId?.trim()) {
    return NextResponse.json({ error: "Quote ID is required" }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data: quote, error: quoteError } = await admin
    .from("ni_service_quotes")
    .select("*")
    .eq("id", body.quoteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status === "paid") {
    return NextResponse.json({ error: "This quote has already been paid" }, { status: 409 });
  }

  if (new Date(quote.expires_at) < new Date()) {
    return NextResponse.json({ error: "This quote has expired. Please request a new quote." }, { status: 410 });
  }

  const service = getServiceBySlug(quote.service_slug);
  if (!service) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  const priceCents = quote.current_price_cents;
  const paymentType = body.paymentType ?? "full";
  const planMonths = Math.max(1, body.planMonths ?? 1);

  const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ["card"];

  if (paymentType === "bnpl") {
    if (priceCents < BNPL_MIN_CENTS || priceCents > BNPL_MAX_CENTS) {
      return NextResponse.json(
        {
          error: `Buy Now, Pay Later is available for orders between ${formatCents(BNPL_MIN_CENTS)} and ${formatCents(BNPL_MAX_CENTS)}.`,
        },
        { status: 400 }
      );
    }
    paymentMethodTypes.push("klarna", "affirm");
  }

  const base = portalAppUrl();
  const stripe = getBillingStripe();
  const now = new Date().toISOString();

  const depositCents = paymentType === "deposit" ? depositCentsForTotal(priceCents) : 0;

  const chargeCents =
    paymentType === "deposit"
      ? depositCents
      : paymentType === "plan" && planMonths > 1
        ? Math.round(priceCents / planMonths)
        : priceCents;

  const productName =
    paymentType === "deposit"
      ? `${service.name} — 20% Deposit`
      : paymentType === "plan" && planMonths > 1
        ? `${service.name} — Payment 1 of ${planMonths}`
        : service.name;

  const productDescription =
    paymentType === "deposit"
      ? `Non-refundable 20% deposit of ${formatCents(priceCents)} total. Your card is saved securely and the remaining ${formatCents(balanceCentsFor(priceCents, depositCents))} balance is charged when your service is marked complete.`
      : paymentType === "plan" && planMonths > 1
        ? `${formatCents(priceCents)} total over ${planMonths} months. Affirm/Klarna soft credit check available at checkout for remaining balance.`
        : paymentType === "bnpl"
          ? "Pay over time with Affirm or Klarna. A soft credit check may be performed."
          : `Intelligence Service — ${formatCents(priceCents)}`;

  const depositExtras =
    paymentType === "deposit"
      ? depositSessionParams({
          serviceSlug: quote.service_slug,
          totalCents: priceCents,
          depositCents,
        })
      : {};

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: chargeCents,
            product_data: {
              name: productName,
              description: productDescription,
              metadata: {
                serviceSlug: quote.service_slug,
                quoteId: quote.id,
              },
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/services?payment=success&quote=${quote.id}`,
      cancel_url: `${base}/services/${quote.service_slug}/request?quote=${quote.id}`,
      customer_email: user.email ?? undefined,
      metadata: {
        serviceCheckout: "true",
        quoteId: quote.id,
        serviceSlug: quote.service_slug,
        userId: user.id,
        totalPriceCents: String(priceCents),
        paymentType,
        planMonths: String(planMonths),
        chargeCents: String(chargeCents),
        ...(paymentType === "deposit"
          ? {
              [DEPOSIT_META.flag]: "true",
              [DEPOSIT_META.serviceSlug]: quote.service_slug,
              [DEPOSIT_META.totalCents]: String(priceCents),
              [DEPOSIT_META.depositCents]: String(depositCents),
              [DEPOSIT_META.balanceCents]: String(balanceCentsFor(priceCents, depositCents)),
            }
          : {}),
      },
      ...depositExtras,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session unavailable" }, { status: 502 });
    }

    await admin.from("ni_service_requests").insert({
      user_id: user.id,
      service_slug: quote.service_slug,
      account_type: quote.account_type,
      payload: quote.intake_payload,
      quote_id: quote.id,
      agreed_price_cents: priceCents,
      payment_plan_months: planMonths,
      stripe_session_id: session.id,
      status: "pending",
      created_at: now,
      updated_at: now,
    });

    await admin
      .from("ni_service_quotes")
      .update({ status: "accepted", updated_at: now })
      .eq("id", quote.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[services/checkout]", err);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
