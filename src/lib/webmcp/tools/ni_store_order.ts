import { resolveCatalogLineRetailCents, resolveCatalogLineSupplierCents } from "@/lib/store/catalog/line-price";
import { refreshCatalogFromCj } from "@/lib/store/catalog/live-cj";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import { ensureStoreEnv } from "@/lib/store/env";
import { getStoreGateStatus } from "@/lib/store/gate";
import { quoteCartShipping } from "@/lib/store/shipping-quote";
import { ensureStoreStripeEnv, getStoreStripe, storeAppUrl } from "@/lib/store/stripe";
import type { ToolHandler } from "../types";

/**
 * Validates the product + quantity, then opens a Stripe Checkout Session using
 * the SAME metadata contract the store's own /api/store/checkout route writes
 * (storeCheckout/catalogCheckout/itemsJson — see src/lib/store/checkout-session.ts
 * parseStoreCheckoutMetadata). That means the existing store webhook
 * (/api/store/webhook -> processStoreCheckoutSession) picks the order up,
 * fulfils it on CJ and sends the confirmation email exactly like a normal cart
 * checkout — this tool never re-implements fulfilment. Shipping address and
 * email are collected by Stripe on the hosted checkout page itself
 * (shipping_address_collection + Stripe's own email field), so an agent that
 * cannot supply them ahead of time isn't blocked; if the buyer's email is
 * known it's passed through as a prefill.
 */
export const handler: ToolHandler = async (_tool, params) => {
  await ensureStoreEnv();
  await ensureStoreStripeEnv();

  const gate = getStoreGateStatus();
  if (!gate.live) {
    return { status: "unavailable", message: gate.message };
  }

  const slug = typeof params.item_sku === "string" ? params.item_sku.trim() : "";
  if (!slug) {
    return { status: "invalid_input", message: "item_sku is required — call ni_store_search for a product_id first." };
  }

  const quantity = Math.max(1, Math.min(10, Number(params.quantity) || 1));

  const shippingAddress =
    params.shipping_address && typeof params.shipping_address === "object"
      ? (params.shipping_address as Record<string, unknown>)
      : null;
  const requiredAddressFields = ["street", "city", "state", "postal_code", "country"] as const;
  if (!shippingAddress || requiredAddressFields.some((f) => !String(shippingAddress[f] ?? "").trim())) {
    return {
      status: "invalid_input",
      message:
        "shipping_address is required (street, city, state, postal_code, country). Checkout only ships to US addresses right now — Stripe collects and validates the exact address on the hosted checkout page.",
    };
  }
  if (String(shippingAddress.country).trim().toUpperCase() !== "US") {
    return { status: "invalid_input", message: "The Smart Store currently ships to US addresses only." };
  }

  let catalog = await getCatalogProductBySlug(slug);
  if (!catalog) {
    return { status: "invalid_input", message: `Unknown item_sku "${slug}". Call ni_store_search first to get a valid product_id.` };
  }

  const refreshed = await refreshCatalogFromCj(catalog);
  if (refreshed.unavailable || !refreshed.row) {
    return { status: "unavailable", message: `${catalog.name} is no longer available from the supplier.` };
  }
  catalog = refreshed.row;

  const variantId = typeof params.variant_id === "string" ? params.variant_id.trim() || null : null;
  const retailCents = resolveCatalogLineRetailCents(catalog, variantId);
  const supplierCents = resolveCatalogLineSupplierCents(catalog, variantId);

  const shippingQuote = await quoteCartShipping([
    { catalog, quantity, shippingTier: "standard", variantId, unitRetailCents: retailCents },
  ]);

  const subtotalCents = retailCents * quantity;
  const shippingCents = shippingQuote.shippingStipendCents;
  const supplierCostCents = supplierCents * quantity;

  let base: string;
  try {
    base = storeAppUrl();
  } catch {
    base = "https://www.northsideintelligence.com";
  }

  const customerEmailRaw = params.email ?? params.customer_email;
  const customerEmail = typeof customerEmailRaw === "string" && customerEmailRaw.includes("@") ? customerEmailRaw.trim() : undefined;

  const stripe = getStoreStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: catalog.currency,
            unit_amount: retailCents,
            product_data: {
              name: catalog.name,
              metadata: { catalogSlug: catalog.slug, sourcePlatform: catalog.sourcePlatform, variantId: variantId ?? "" },
            },
          },
          quantity,
        },
        {
          price_data: {
            currency: catalog.currency,
            unit_amount: shippingCents,
            product_data: { name: "Shipping & Handling", description: "Includes carrier postage and handling." },
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/store/cart?ordered=1`,
      cancel_url: `${base}/store/cart`,
      customer_email: customerEmail,
      customer_creation: "always",
      payment_intent_data: { setup_future_usage: "off_session" },
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        source: "webmcp",
        storeCheckout: "true",
        catalogCheckout: "true",
        guestCheckout: "true",
        userId: "",
        shippingEstimateCents: String(shippingQuote.shippingEstimateCents),
        shippingChargedCents: String(shippingCents),
        shippingStipendCents: String(shippingCents),
        supplierCostCents: String(supplierCostCents),
        itemsJson: JSON.stringify([
          { slug: catalog.slug, quantity, shippingTier: "standard", variantId, cjVariantId: variantId, cj_variant_id: variantId },
        ]),
      },
    });

    if (!session.url) return { status: "unavailable", message: "Checkout is temporarily unavailable." };

    return {
      status: "awaiting_payment",
      checkout_url: session.url,
      order_id: session.id,
      amount_usd: (subtotalCents + shippingCents) / 100,
      message:
        "Send checkout_url to the buyer to enter shipping address and pay. The store's existing webhook fulfils the order on CJ and emails a confirmation automatically once Stripe confirms payment — no further tool call is required, though ni_order_status can also be polled with order_id.",
    };
  } catch (err) {
    console.error("[webmcp] ni_store_order failed:", err);
    return { status: "unavailable", message: "Unable to start checkout right now." };
  }
};
