import { NextRequest, NextResponse } from "next/server";
import { calculateCartTotals } from "@/lib/store/cart/pricing";
import type { CartLineItem, ShippingTier } from "@/lib/store/cart/types";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import { ensureStoreEnv } from "@/lib/store/env";
import { getStoreGateStatus } from "@/lib/store/gate";
import { ensureStoreStripeEnv, getStoreStripe, storeAppUrl } from "@/lib/store/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface CheckoutItemBody {
  slug?: string;
  quantity?: number;
  shippingTier?: ShippingTier;
}

export async function POST(req: NextRequest) {
  await ensureStoreEnv();
  await ensureStoreStripeEnv();

  const gate = getStoreGateStatus();
  if (!gate.live) {
    return NextResponse.json({ error: "Checkout is not available right now." }, { status: 403 });
  }

  let body: { items?: CheckoutItemBody[] };
  try {
    body = (await req.json()) as { items?: CheckoutItemBody[] };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const rawItems = body.items ?? [];
  if (!rawItems.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const cartLines: CartLineItem[] = [];
  for (const raw of rawItems) {
    const slug = raw.slug?.trim();
    if (!slug) continue;
    const catalog = await getCatalogProductBySlug(slug);
    if (!catalog) {
      return NextResponse.json({ error: `Product not found: ${slug}` }, { status: 404 });
    }
    const quantity = Math.max(1, Math.min(10, Number(raw.quantity) || 1));
    const shippingTier: ShippingTier =
      raw.shippingTier === "expedited" ? "expedited" : "standard";
    cartLines.push({
      slug: catalog.slug,
      name: catalog.name,
      imageUrl: catalog.imageUrl,
      retailPriceCents: catalog.retailPriceCents,
      currency: catalog.currency,
      sourcePlatform: catalog.sourcePlatform,
      sourceProductId: catalog.sourceProductId,
      quantity,
      shippingTier,
    });
  }

  if (!cartLines.length) {
    return NextResponse.json({ error: "No valid cart items" }, { status: 400 });
  }

  const totals = calculateCartTotals(cartLines);
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = storeAppUrl();
  const stripe = getStoreStripe();

  const lineItems = [
    ...cartLines.map((item) => ({
      price_data: {
        currency: item.currency,
        unit_amount: item.retailPriceCents,
        product_data: {
          name: item.name,
          images: item.imageUrl ? [item.imageUrl] : undefined,
          metadata: {
            catalogSlug: item.slug,
            sourcePlatform: item.sourcePlatform,
          },
        },
      },
      quantity: item.quantity,
    })),
    {
      price_data: {
        currency: cartLines[0]?.currency ?? "usd",
        unit_amount: totals.shippingCents,
        product_data: {
          name: totals.hasExpedited
            ? "Estimated Shipping & Handling (Expedited)"
            : "Estimated Shipping & Handling",
          description:
            "NI estimates shipping at checkout. Unused shipping is refunded after fulfillment.",
        },
      },
      quantity: 1,
    },
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${base}/store/cart?ordered=1`,
      cancel_url: `${base}/store/cart`,
      customer_email: user?.email ?? undefined,
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        storeCheckout: "true",
        catalogCheckout: "true",
        userId: user?.id ?? "",
        shippingEstimateCents: String(totals.shippingEstimateCents),
        shippingChargedCents: String(totals.shippingCents),
        itemsJson: JSON.stringify(
          cartLines.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            shippingTier: item.shippingTier,
          }))
        ),
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session unavailable" }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[store/checkout]", err);
    return NextResponse.json({ error: "Unable to start checkout." }, { status: 500 });
  }
}
