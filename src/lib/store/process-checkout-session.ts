import "server-only";

import type Stripe from "stripe";
import type { ShippingTier } from "@/lib/store/cart/types";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import { resolveCatalogLineRetailCents } from "@/lib/store/catalog/line-price";
import {
  createPaidCatalogOrder,
  findOrderByCheckoutSessionId,
  type CatalogCheckoutLine,
} from "@/lib/store/catalog-orders";
import {
  parseStoreCheckoutMetadata,
  resolveStoreCustomerEmail,
  resolveStoreShippingDetails,
  type StoreCheckoutSkipReason,
} from "@/lib/store/checkout-session";
import {
  sendStoreOrderAdminNotificationEmail,
  sendStoreOrderConfirmationEmail,
} from "@/lib/store/order-emails";
import { fulfillStoreOrder } from "@/lib/store/fulfill-order";
import { isStoreCheckoutLive } from "@/lib/store/gate";
import { getStoreOrderById } from "@/lib/store/orders";
import { buildStoreOrderTrackUrl } from "@/lib/store/tracking";
import { createNotification } from "@/lib/notifications/service";
import { recordPromoConversion } from "@/lib/promos/email-campaigns";
import { createServiceClient } from "@/lib/supabase/server";

export interface ProcessStoreCheckoutResult {
  status: "created" | "existing" | "skipped";
  orderId?: string;
  skipReason?: StoreCheckoutSkipReason;
  fulfillmentSent?: boolean;
  confirmationEmailSent?: boolean;
  adminNotificationSent?: boolean;
}

export interface ProcessStoreCheckoutOptions {
  sendConfirmationEmail?: boolean;
  sendAdminNotification?: boolean;
  refireMakeWebhook?: boolean;
  resendEmails?: boolean;
}

async function buildCatalogLines(
  parsedItems: Array<{
    slug: string;
    quantity: number;
    shippingTier: ShippingTier;
    variantId?: string | null;
  }>
): Promise<CatalogCheckoutLine[]> {
  const lines: CatalogCheckoutLine[] = [];

  for (const item of parsedItems) {
    const catalog = await getCatalogProductBySlug(item.slug);
    if (!catalog) {
      throw new Error(`Product not found: ${item.slug}`);
    }

    const variantId = item.variantId?.trim() || null;
    const unitPriceCents = resolveCatalogLineRetailCents(catalog, variantId);
    lines.push({
      catalog,
      quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
      shippingTier: item.shippingTier === "expedited" ? "expedited" : "standard",
      variantId,
      unitPriceCents,
    });
  }

  return lines;
}

function resolveCustomerName(
  shipping: Record<string, unknown> | null
): string | null {
  if (!shipping || typeof shipping !== "object") return null;
  return typeof shipping.name === "string" ? shipping.name : null;
}

async function sendOrderEmails(
  orderId: string,
  input: {
    customerEmail: string | null;
    customerName: string | null;
    guestCheckout: boolean;
    totalCents: number;
    currency: string;
    shipping: Record<string, unknown> | null;
    lines: CatalogCheckoutLine[];
  },
  options: ProcessStoreCheckoutOptions
): Promise<{ confirmationEmailSent: boolean; adminNotificationSent: boolean }> {
  const linePayload = input.lines.map((line) => ({
    productName: line.catalog.name,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    shippingTier: line.shippingTier,
  }));

  let confirmationEmailSent = false;
  let adminNotificationSent = false;

  if (options.sendConfirmationEmail !== false && input.customerEmail) {
    const emailResult = await sendStoreOrderConfirmationEmail({
      to: input.customerEmail,
      orderId,
      totalCents: input.totalCents,
      currency: input.currency,
      lines: linePayload,
      shipping: input.shipping,
      trackPageUrl: buildStoreOrderTrackUrl(orderId, input.customerEmail),
      resend: options.resendEmails,
    });
    confirmationEmailSent = emailResult.sent;
    if (emailResult.error) {
      console.error("[store/checkout] confirmation email failed", emailResult.error);
    }
  }

  if (options.sendAdminNotification !== false) {
    const adminResult = await sendStoreOrderAdminNotificationEmail({
      orderId,
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      guestCheckout: input.guestCheckout,
      totalCents: input.totalCents,
      currency: input.currency,
      lines: linePayload.map((line) => ({
        productName: line.productName,
        quantity: line.quantity,
      })),
      shipping: input.shipping,
      resend: options.resendEmails,
    });
    adminNotificationSent = adminResult.sent;
    if (adminResult.error) {
      console.error("[store/checkout] admin notification failed", adminResult.error);
    }
  }

  return { confirmationEmailSent, adminNotificationSent };
}

export async function processStoreCheckoutSession(
  session: Stripe.Checkout.Session,
  options: ProcessStoreCheckoutOptions = {}
): Promise<ProcessStoreCheckoutResult> {
  const parsed = parseStoreCheckoutMetadata(session);
  if (!parsed.ok) {
    return { status: "skipped", skipReason: parsed.reason };
  }

  const guestCheckout = session.metadata?.guestCheckout === "true" || !parsed.userId;
  const customerEmail = resolveStoreCustomerEmail(session);
  const shipping = resolveStoreShippingDetails(session);
  const customerName = resolveCustomerName(shipping);

  const existingOrderId = await findOrderByCheckoutSessionId(session.id);
  if (existingOrderId) {
    if (options.refireMakeWebhook || options.resendEmails) {
      const existing = await getStoreOrderById(existingOrderId);
      if (!existing) {
        return { status: "existing", orderId: existingOrderId };
      }

      let fulfillmentSent =
        existing.status === "fulfillment_sent" ||
        existing.status === "shipped" ||
        existing.status === "delivered" ||
        Boolean(existing.cjOrderId);

      if (options.refireMakeWebhook && isStoreCheckoutLive()) {
        const fulfillment = await fulfillStoreOrder({
          orderId: existingOrderId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          skipIfCjExists: true,
        });
        if (fulfillment.cjSubmitted || fulfillment.makeNotified) {
          fulfillmentSent = true;
        }
        if (fulfillment.error) {
          console.error("[store/checkout] CJ fulfillment refire failed", fulfillment.error);
        }
        if (fulfillment.cjPaymentError) {
          console.warn("[store/checkout] CJ payment pending", fulfillment.cjPaymentError);
        }
      }

      const lines = await buildCatalogLines(parsed.items);
      const emails = await sendOrderEmails(
        existingOrderId,
        {
          customerEmail,
          customerName,
          guestCheckout,
          totalCents: existing.totalCents,
          currency: existing.currency,
          shipping,
          lines,
        },
        options
      );

      return {
        status: "existing",
        orderId: existingOrderId,
        fulfillmentSent,
        ...emails,
      };
    }

    return { status: "existing", orderId: existingOrderId };
  }

  const lines = await buildCatalogLines(parsed.items);
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0
  );
  const totalCents = session.amount_total ?? subtotalCents + parsed.shippingChargedCents;

  const orderId = await createPaidCatalogOrder({
    userId: parsed.userId,
    guestCheckout,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    customerEmail,
    shipping,
    subtotalCents,
    shippingCents: parsed.shippingChargedCents,
    shippingEstimateCents: parsed.shippingEstimateCents,
    totalCents,
    currency: session.currency ?? "usd",
    lines,
  });

  let fulfillmentSent = false;
  if (isStoreCheckoutLive()) {
    const fulfillment = await fulfillStoreOrder({
      orderId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    });
    fulfillmentSent = fulfillment.cjSubmitted;
    if (fulfillment.error) {
      console.error("[store/checkout] CJ fulfillment failed", fulfillment.error);
    }
    if (fulfillment.cjPaymentError) {
      console.warn("[store/checkout] CJ payment pending", fulfillment.cjPaymentError);
    }
  }

  const emails = await sendOrderEmails(
    orderId,
    {
      customerEmail,
      customerName,
      guestCheckout,
      totalCents,
      currency: session.currency ?? "usd",
      shipping,
      lines,
    },
    options
  );

  if (parsed.userId) {
    await recordPromoConversion(parsed.userId, totalCents, { orderId, source: "store" });

    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("ni_portal_profiles")
      .select("email")
      .eq("id", parsed.userId)
      .maybeSingle();

    await createNotification({
      userId: parsed.userId,
      category: "store_order",
      title: "Smart Store Order Confirmed",
      body: `Your order #${orderId.slice(0, 8).toUpperCase()} has been received and is being processed.`,
      link: customerEmail ? buildStoreOrderTrackUrl(orderId, customerEmail) : "/store/track",
      userEmail: profile?.email ?? customerEmail,
      metadata: { orderId },
      sendEmail: false,
    });
  }

  return {
    status: "created",
    orderId,
    fulfillmentSent,
    ...emails,
  };
}
