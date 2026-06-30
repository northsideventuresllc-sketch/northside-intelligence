import type Stripe from "stripe";
import type { ShippingTier } from "@/lib/store/cart/types";

export const STORE_STRIPE_WEBHOOK_PATH = "/api/store/webhook";

export const STORE_STRIPE_WEBHOOK_URLS = [
  "https://www.northsideintelligence.com/api/store/webhook",
  "https://northsideintelligence.com/api/store/webhook",
  // Legacy registrations — still served by /api/store/webhooks/stripe
  "https://www.northsideintelligence.com/api/store/webhooks/stripe",
  "https://northsideintelligence.com/api/store/webhooks/stripe",
] as const;

export interface StoreCheckoutCartItem {
  slug: string;
  quantity: number;
  shippingTier: ShippingTier;
  variantId?: string | null;
}

export type StoreCheckoutSkipReason =
  | "not_store_checkout"
  | "legacy_checkout_disabled"
  | "missing_cart_metadata"
  | "invalid_cart_metadata";

export type StoreCheckoutParseResult =
  | { ok: true; userId: string | null; items: StoreCheckoutCartItem[]; shippingChargedCents: number; shippingEstimateCents: number }
  | { ok: false; reason: StoreCheckoutSkipReason | "invalid_cart_metadata" };

export function isStoreCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.storeCheckout === "true";
}

export function isCatalogCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.metadata?.catalogCheckout === "true";
}

export function parseStoreCheckoutMetadata(
  session: Stripe.Checkout.Session
): StoreCheckoutParseResult {
  if (!isStoreCheckoutSession(session)) {
    return { ok: false, reason: "not_store_checkout" };
  }

  if (!isCatalogCheckoutSession(session)) {
    return { ok: false, reason: "legacy_checkout_disabled" };
  }

  const itemsJson = session.metadata?.itemsJson;
  if (!itemsJson) {
    return { ok: false, reason: "missing_cart_metadata" };
  }

  let parsedItems: StoreCheckoutCartItem[];
  try {
    parsedItems = JSON.parse(itemsJson) as StoreCheckoutCartItem[];
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return { ok: false, reason: "invalid_cart_metadata" };
    }
  } catch {
    return { ok: false, reason: "invalid_cart_metadata" };
  }

  const userId = session.metadata?.userId?.trim() || null;
  const shippingChargedCents = Number(session.metadata?.shippingChargedCents) || 0;
  const shippingEstimateCents =
    Number(session.metadata?.shippingEstimateCents) || shippingChargedCents;

  return {
    ok: true,
    userId,
    items: parsedItems,
    shippingChargedCents,
    shippingEstimateCents,
  };
}

export function resolveStoreCustomerEmail(session: Stripe.Checkout.Session): string | null {
  return session.customer_details?.email ?? session.customer_email ?? null;
}

export function resolveStoreShippingDetails(
  session: Stripe.Checkout.Session
): Record<string, unknown> | null {
  return (session as Stripe.Checkout.Session & { shipping_details?: unknown }).shipping_details as
    | Record<string, unknown>
    | null;
}

export function formatOrderReference(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
