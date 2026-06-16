import { NextRequest, NextResponse } from "next/server";
import { canCheckoutProductServer, getStoreGateStatus } from "@/lib/store/gate";
import { getStoreProductBySlug } from "@/lib/store/products";
import { ensureStoreStripeEnv, getStoreStripe, storeAppUrl } from "@/lib/store/stripe";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST(req: NextRequest) {
  await ensureStoreStripeEnv();

  const gate = getStoreGateStatus();
  if (!gate.live) {
    return NextResponse.json(
      { error: "Store checkout is not live yet. CJDropshipping integration pending." },
      { status: 403 }
    );
  }

  let body: { productSlug?: string; quantity?: number };
  try {
    body = (await req.json()) as { productSlug?: string; quantity?: number };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const productSlug = body.productSlug?.trim();
  const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));
  if (!productSlug) {
    return NextResponse.json({ error: "productSlug is required" }, { status: 400 });
  }

  const product = await getStoreProductBySlug(productSlug);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!canCheckoutProductServer({ isMock: product.isMock })) {
    return NextResponse.json(
      { error: "This product is not available for checkout yet." },
      { status: 403 }
    );
  }

  if (!product.stripePriceId) {
    return NextResponse.json(
      { error: "Stripe price not configured for this product." },
      { status: 503 }
    );
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = storeAppUrl();
  const stripe = getStoreStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: product.stripePriceId, quantity }],
      success_url: `${base}/store?ordered=${product.slug}`,
      cancel_url: `${base}/store`,
      customer_email: user?.email ?? undefined,
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        storeCheckout: "true",
        productSlug: product.slug,
        userId: user?.id ?? "",
        quantity: String(quantity),
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
