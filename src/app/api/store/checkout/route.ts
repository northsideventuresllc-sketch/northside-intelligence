import { NextRequest, NextResponse } from "next/server";
import type { CartLineItem, ShippingTier } from "@/lib/store/cart/types";
import { resolveCatalogLineRetailCents, resolveCatalogLineSupplierCents } from "@/lib/store/catalog/line-price";
import { refreshCatalogFromCj } from "@/lib/store/catalog/live-cj";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import { ensureStoreEnv } from "@/lib/store/env";
import { getStoreGateStatus } from "@/lib/store/gate";
import { quoteCartShipping } from "@/lib/store/shipping-quote";
import { ensureStoreStripeEnv, getStoreStripe, storeAppUrl } from "@/lib/store/stripe";
import type { PriceChangeNotice } from "@/lib/store/sources/types";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface CheckoutItemBody {
  slug?: string;
  quantity?: number;
  shippingTier?: ShippingTier;
  retailPriceCents?: number;
  variantId?: string | null;
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
  const priceChangeNotices: PriceChangeNotice[] = [];

  for (const raw of rawItems) {
    const slug = raw.slug?.trim();
    if (!slug) continue;

    let catalog = await getCatalogProductBySlug(slug);
    if (!catalog) {
      return NextResponse.json({ error: `Product not found: ${slug}` }, { status: 404 });
    }

    const refreshed = await refreshCatalogFromCj(catalog);
    if (refreshed.unavailable || !refreshed.row) {
      return NextResponse.json(
        { error: `${catalog.name} is no longer available on CJ.` },
        { status: 409 }
      );
    }
    catalog = refreshed.row;

    const variantId = raw.variantId?.trim() || null;
    const currentRetailCents = resolveCatalogLineRetailCents(catalog, variantId);
    const clientRetailCents = raw.retailPriceCents;

    if (
      clientRetailCents != null &&
      Number.isFinite(clientRetailCents) &&
      clientRetailCents !== currentRetailCents
    ) {
      priceChangeNotices.push({
        slug: catalog.slug,
        name: catalog.name,
        previousRetailCents: clientRetailCents,
        currentRetailCents,
        reason: "Product pricing changed since your last view. Review the updated total before checkout.",
      });
    }

    const quantity = Math.max(1, Math.min(10, Number(raw.quantity) || 1));
    const shippingTier: ShippingTier =
      raw.shippingTier === "expedited" ? "expedited" : "standard";

    cartLines.push({
      slug: catalog.slug,
      name: catalog.name,
      imageUrl: catalog.imageUrl,
      retailPriceCents: currentRetailCents,
      currency: catalog.currency,
      sourcePlatform: catalog.sourcePlatform,
      sourceProductId: catalog.sourceProductId,
      variantId,
      quantity,
      shippingTier,
    });
  }

  if (priceChangeNotices.length) {
    return NextResponse.json(
      {
        error: "Prices updated from CJ before checkout.",
        priceChangeNotices,
        items: cartLines.map((line) => ({
          slug: line.slug,
          name: line.name,
          imageUrl: line.imageUrl,
          retailPriceCents: line.retailPriceCents,
          currency: line.currency,
          sourcePlatform: line.sourcePlatform,
          sourceProductId: line.sourceProductId,
          variantId: line.variantId,
          quantity: line.quantity,
          shippingTier: line.shippingTier,
        })),
      },
      { status: 409 }
    );
  }

  if (!cartLines.length) {
    return NextResponse.json({ error: "No valid cart items" }, { status: 400 });
  }

  // Build quote lines with full catalog rows for accurate supplier + freight data.
  const fullQuoteLines = [];
  for (const item of cartLines) {
    const catalog = await getCatalogProductBySlug(item.slug);
    if (!catalog) continue;
    fullQuoteLines.push({
      catalog,
      quantity: item.quantity,
      shippingTier: item.shippingTier,
      variantId: item.variantId,
      unitRetailCents: item.retailPriceCents,
    });
  }

  const shippingQuote = await quoteCartShipping(fullQuoteLines);
  const subtotalCents = cartLines.reduce(
    (sum, item) => sum + item.retailPriceCents * item.quantity,
    0
  );
  const supplierCostCents = fullQuoteLines.reduce(
    (sum, line) =>
      sum + resolveCatalogLineSupplierCents(line.catalog, line.variantId) * line.quantity,
    0
  );
  const shippingCents = shippingQuote.shippingStipendCents;
  const totals = {
    subtotalCents,
    shippingCents,
    shippingEstimateCents: shippingQuote.shippingEstimateCents,
    totalCents: subtotalCents + shippingCents,
    hasExpedited: shippingQuote.hasExpedited,
  };
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
          metadata: {
            catalogSlug: item.slug,
            sourcePlatform: item.sourcePlatform,
            variantId: item.variantId ?? "",
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
            ? "Shipping & Handling (Expedited)"
            : "Shipping & Handling",
          description:
            "Includes carrier postage and handling. Any unused amount is refunded after your order ships.",
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
      customer_creation: "always",
      payment_intent_data: {
        setup_future_usage: "off_session",
      },
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        storeCheckout: "true",
        catalogCheckout: "true",
        guestCheckout: user ? "false" : "true",
        userId: user?.id ?? "",
        shippingEstimateCents: String(totals.shippingEstimateCents),
        shippingChargedCents: String(totals.shippingCents),
        shippingStipendCents: String(totals.shippingCents),
        supplierCostCents: String(supplierCostCents),
        itemsJson: JSON.stringify(
          cartLines.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            shippingTier: item.shippingTier,
            variantId: item.variantId,
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
    const message =
      err instanceof Error && err.message ? err.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
