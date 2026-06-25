/**
 * Resend Smart Store order emails and optionally re-fire Make fulfillment.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/resend-store-order-notifications.ts [order_id] [--refire-make]
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { formatOrderReference } from "../src/lib/store/checkout-session";
import {
  buildStoreOrderAdminNotificationHtml,
  buildStoreOrderConfirmationEmailHtmlWithTracking,
} from "../src/lib/store/order-emails-html";
import { buildStoreOrderTrackUrl } from "../src/lib/store/tracking";
import { hydrateScriptEnv } from "./lib/load-platform-secrets";

const DEFAULT_ORDER_ID = "908a8f2f-e0e9-4ee7-b71d-55083f6f5665";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://kxijunwgbrlfzvgkhklo.supabase.co";

async function main() {
  const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const orderId = positionalArgs[0]?.trim() || DEFAULT_ORDER_ID;
  const refireMake = process.argv.includes("--refire-make");

  await hydrateScriptEnv([
    "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET",
    "MAKE_STORE_WEBHOOK_URL",
    "CJ_DROPSHIPPING_API_KEY",
    "NI_STORE_LIVE",
    "RESEND_API_KEY",
    "NI_STORE_ORDERS_NOTIFY_EMAIL",
  ]);

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error } = await supabase
    .from("ni_store_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) throw new Error(error?.message ?? `Order not found: ${orderId}`);

  const { data: items, error: itemsError } = await supabase
    .from("ni_store_order_items")
    .select("*")
    .eq("order_id", orderId);
  if (itemsError) throw new Error(itemsError.message);

  const customerEmail = order.customer_email ? String(order.customer_email) : null;
  if (!customerEmail) throw new Error("Order is missing customer email");

  const lineItems = (items ?? []).map((item) => ({
    productName: String(item.product_name ?? "Item"),
    productSlug: item.product_slug ? String(item.product_slug) : null,
    sourcePlatform: "cj",
    sourceProductId: item.source_product_id ? String(item.source_product_id) : null,
    variantId: item.variant_id ? String(item.variant_id) : null,
    quantity: Number(item.quantity ?? 1),
    unitPriceCents: Number(item.unit_price_cents ?? 0),
    shippingTier: String(item.shipping_tier ?? "standard"),
  }));

  let fulfillmentSent = false;
  const cronSecret = process.env.CRON_SECRET?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

  if (refireMake && cronSecret) {
    const res = await fetch(`${appUrl}/api/store/orders/fulfill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({
        orderId,
        stripeCheckoutSessionId: order.stripe_checkout_session_id,
        stripePaymentIntentId: order.stripe_payment_intent_id,
        skipIfCjExists: false,
        notifyMake: true,
      }),
    });

    if (res.ok) {
      const payload = (await res.json()) as { cjSubmitted?: boolean; makeNotified?: boolean };
      fulfillmentSent = Boolean(payload.cjSubmitted || payload.makeNotified);
    } else {
      console.error("[resend] fulfill API failed", res.status, await res.text().catch(() => ""));
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from =
    process.env.NI_NOREPLY_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    "Northside Intelligence <noreply@northsideintelligence.com>";
  const adminTo =
    process.env.NI_STORE_ORDERS_NOTIFY_EMAIL?.trim() || "info@northsideintelligence.com";
  const orderRef = formatOrderReference(orderId);
  const trackPageUrl = buildStoreOrderTrackUrl(orderId, customerEmail);
  const shipping = (order.shipping as Record<string, unknown> | null) ?? null;

  const confirmation = await resend.emails.send(
    {
      from,
      to: [customerEmail],
      subject: `Order #${orderRef} Confirmed | Northside Intelligence Smart Store`,
      html: buildStoreOrderConfirmationEmailHtmlWithTracking({
        to: customerEmail,
        orderId,
        totalCents: Number(order.total_cents),
        currency: String(order.currency ?? "usd"),
        lines: lineItems,
        shipping,
        trackPageUrl,
      }),
    },
    { idempotencyKey: `store-order-confirmation/${orderId}/resend-${Date.now()}` }
  );

  const admin = await resend.emails.send(
    {
      from,
      to: [adminTo],
      subject: `New Smart Store Order #${orderRef} — ${lineItems.map((l) => l.productName).join(", ")}`,
      html: buildStoreOrderAdminNotificationHtml({
        orderId,
        customerEmail,
        customerName: shipping && typeof shipping.name === "string" ? shipping.name : null,
        guestCheckout: Boolean(order.guest_checkout),
        totalCents: Number(order.total_cents),
        currency: String(order.currency ?? "usd"),
        lines: lineItems.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
        })),
        shipping,
      }),
    },
    { idempotencyKey: `store-order-admin/${orderId}/resend-${Date.now()}` }
  );

  console.log(
    JSON.stringify(
      {
        orderId,
        customerEmail,
        adminTo,
        fulfillmentSent,
        confirmationEmailSent: !confirmation.error,
        adminNotificationSent: !admin.error,
        confirmationError: confirmation.error?.message,
        adminError: admin.error?.message,
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
