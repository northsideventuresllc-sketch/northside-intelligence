/**
 * Replay a paid Smart Store checkout session that missed the Stripe webhook.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/replay-store-checkout.ts [checkout_session_id]
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";
import { resolveCatalogLineRetailCents } from "../src/lib/store/catalog/line-price";
import {
  parseStoreCheckoutMetadata,
  resolveStoreCustomerEmail,
  resolveStoreShippingDetails,
  formatOrderReference,
} from "../src/lib/store/checkout-session";
import { buildStoreOrderConfirmationEmailHtml } from "../src/lib/store/order-confirmation-email-html";
import { hydrateScriptEnv } from "./lib/load-platform-secrets";

const DEFAULT_SESSION_ID = "cs_live_b1bDOtIZ9bjuoGx7J0FRKq5vuShdkbC8NFJB2Wf4EncESltBbIVSDQ8dQP";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://kxijunwgbrlfzvgkhklo.supabase.co";

function parseVariants(raw: unknown): Array<{
  id: string;
  name: string;
  retailPriceCents: number;
  imageUrl: string | null;
}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (entry == null || typeof entry !== "object") return null;
      const v = entry as Record<string, unknown>;
      const id = v.id != null ? String(v.id) : "";
      const name = v.name != null ? String(v.name) : "";
      const retailPriceCents = Number(v.retail_price_cents ?? v.retailPriceCents);
      if (!id || !name || !Number.isFinite(retailPriceCents)) return null;
      const imageUrl = v.image_url ?? v.imageUrl;
      return {
        id,
        name,
        retailPriceCents,
        imageUrl: typeof imageUrl === "string" ? imageUrl : null,
      };
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
}

async function main() {
  const sessionId = process.argv[2]?.trim() || DEFAULT_SESSION_ID;

  await hydrateScriptEnv([
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "MAKE_STORE_WEBHOOK_URL",
    "CJ_DROPSHIPPING_API_KEY",
    "NI_STORE_LIVE",
    "RESEND_API_KEY",
  ]);

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY missing");

  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  const { data: existing } = await supabase
    .from("ni_store_orders")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (existing?.id) {
    console.log(JSON.stringify({ status: "existing", orderId: existing.id }, null, 2));
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    throw new Error(`Session ${sessionId} is not paid (status: ${session.payment_status})`);
  }

  const parsed = parseStoreCheckoutMetadata(session);
  if (!parsed.ok) throw new Error(`Session skipped: ${parsed.reason}`);

  const lines: Array<{
    catalog: {
      id: string;
      slug: string;
      name: string;
      sourcePlatform: string;
      sourceProductId: string | null;
      retailPriceCents: number;
      variants: ReturnType<typeof parseVariants>;
    };
    quantity: number;
    shippingTier: "standard" | "expedited";
    variantId: string | null;
    unitPriceCents: number;
  }> = [];

  for (const item of parsed.items) {
    const { data: row, error } = await supabase
      .from("ni_store_catalog")
      .select("*")
      .eq("slug", item.slug)
      .maybeSingle();

    if (error || !row) throw new Error(`Product not found: ${item.slug}`);

    const catalog = {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      sourcePlatform: String(row.source_platform ?? "cj"),
      sourceProductId: row.source_product_id != null ? String(row.source_product_id) : null,
      retailPriceCents: Number(row.retail_price_cents),
      variants: parseVariants(row.cj_variants),
    };

    const variantId = item.variantId?.trim() || null;
    lines.push({
      catalog,
      quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
      shippingTier: item.shippingTier === "expedited" ? "expedited" : "standard",
      variantId,
      unitPriceCents: resolveCatalogLineRetailCents(catalog, variantId),
    });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const totalCents = session.amount_total ?? subtotalCents + parsed.shippingChargedCents;
  const customerEmail = resolveStoreCustomerEmail(session);
  const shipping = resolveStoreShippingDetails(session);

  const { data: order, error: orderError } = await supabase
    .from("ni_store_orders")
    .insert({
      user_id: parsed.userId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      status: "paid",
      customer_email: customerEmail,
      shipping,
      total_cents: totalCents,
      currency: session.currency ?? "usd",
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order");

  const itemRows = lines.map((line) => ({
    order_id: order.id,
    catalog_id: line.catalog.id,
    product_slug: line.catalog.slug,
    product_name: line.catalog.name,
    source_product_id: line.catalog.sourceProductId,
    variant_id: line.variantId,
    quantity: line.quantity,
    unit_price_cents: line.unitPriceCents,
    shipping_tier: line.shippingTier,
  }));

  const { error: itemError } = await supabase.from("ni_store_order_items").insert(itemRows);
  if (itemError) throw new Error(itemError.message);

  let fulfillmentSent = false;
  const makeUrl = process.env.MAKE_STORE_WEBHOOK_URL?.trim();
  const storeLive =
    Boolean(process.env.CJ_DROPSHIPPING_API_KEY?.trim()) &&
    Boolean(makeUrl) &&
    !makeUrl.includes("placeholder") &&
    ["true", "1"].includes((process.env.NI_STORE_LIVE ?? "").trim().toLowerCase());

  if (storeLive && makeUrl) {
    const res = await fetch(makeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        customerEmail,
        shipping,
        totalCents,
        currency: session.currency ?? "usd",
        items: lines.map((line) => ({
          productSlug: line.catalog.slug,
          productName: line.catalog.name,
          sourcePlatform: line.catalog.sourcePlatform,
          sourceProductId: line.catalog.sourceProductId,
          cjProductId: line.catalog.sourcePlatform === "cj" ? line.catalog.sourceProductId : null,
          variantId: line.variantId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          shippingTier: line.shippingTier,
        })),
      }),
    });

    if (res.ok) {
      await supabase
        .from("ni_store_orders")
        .update({
          status: "fulfillment_sent",
          make_webhook_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      fulfillmentSent = true;
    } else {
      console.error("[replay] Make webhook failed", res.status, await res.text().catch(() => ""));
    }
  }

  let confirmationEmailSent = false;
  if (customerEmail && process.env.RESEND_API_KEY?.trim()) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const orderRef = formatOrderReference(String(order.id));
    const from =
      process.env.NI_NOREPLY_FROM_EMAIL ??
      process.env.RESEND_FROM_EMAIL ??
      "Northside Intelligence <noreply@northsideintelligence.com>";

    const { error } = await resend.emails.send(
      {
        from,
        to: [customerEmail],
        subject: `Order #${orderRef} Confirmed | Northside Intelligence Smart Store`,
        html: buildStoreOrderConfirmationEmailHtml({
          to: customerEmail,
          orderId: String(order.id),
          totalCents,
          currency: session.currency ?? "usd",
          lines: lines.map((line) => ({
            productName: line.catalog.name,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            shippingTier: line.shippingTier,
          })),
          shipping,
        }),
      },
      { idempotencyKey: `store-order-confirmation/${order.id}` }
    );

    if (error) {
      console.error("[replay] confirmation email failed", error.message);
    } else {
      confirmationEmailSent = true;
    }
  }

  console.log(
    JSON.stringify(
      {
        status: "created",
        orderId: order.id,
        customerEmail,
        fulfillmentSent,
        confirmationEmailSent,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
