/**
 * Regression checks for Smart Store Stripe webhook handling.
 * Run: npx tsx scripts/verify-store-webhook.ts
 */
import type Stripe from "stripe";
import {
  STORE_STRIPE_WEBHOOK_URLS,
  formatOrderReference,
  isCatalogCheckoutSession,
  isStoreCheckoutSession,
  parseStoreCheckoutMetadata,
} from "../src/lib/store/checkout-session";
import { buildStoreOrderConfirmationEmailHtml } from "../src/lib/store/order-confirmation-email-html";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

function makeSession(metadata: Record<string, string>): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    metadata,
    amount_total: 1150,
    currency: "usd",
    customer_details: { email: "abby.pfriedman@gmail.com" },
    shipping_details: {
      name: "Abby Friedman",
      address: {
        line1: "3777 Montford Dr",
        city: "Atlanta",
        state: "GA",
        postal_code: "30341",
        country: "US",
      },
    },
  } as Stripe.Checkout.Session;
}

assert(
  STORE_STRIPE_WEBHOOK_URLS.includes(
    "https://www.northsideintelligence.com/api/store/webhooks/stripe"
  ),
  "primary store webhook URL must use www"
);

const valid = makeSession({
  storeCheckout: "true",
  catalogCheckout: "true",
  userId: "",
  shippingChargedCents: "350",
  shippingEstimateCents: "350",
  itemsJson: JSON.stringify([
    { slug: "test-product", quantity: 1, shippingTier: "standard", variantId: null },
  ]),
});

assert(isStoreCheckoutSession(valid), "valid session is store checkout");
assert(isCatalogCheckoutSession(valid), "valid session is catalog checkout");

const parsed = parseStoreCheckoutMetadata(valid);
assert(parsed.ok, "valid metadata parses");
if (parsed.ok) {
  assert(parsed.userId === null, "empty userId becomes null");
  assert(parsed.items.length === 1, "one cart line");
  assert(parsed.shippingChargedCents === 350, "shipping charged parsed");
}

const skipped = parseStoreCheckoutMetadata(
  makeSession({ storeCheckout: "false", catalogCheckout: "true", itemsJson: "[]" })
);
assert(!skipped.ok && skipped.reason === "not_store_checkout", "non-store checkout skipped");

const legacy = parseStoreCheckoutMetadata(
  makeSession({
    storeCheckout: "true",
    catalogCheckout: "false",
    itemsJson: JSON.stringify([{ slug: "x", quantity: 1, shippingTier: "standard" }]),
  })
);
assert(!legacy.ok && legacy.reason === "legacy_checkout_disabled", "legacy checkout skipped");

const badJson = parseStoreCheckoutMetadata(
  makeSession({ storeCheckout: "true", catalogCheckout: "true", itemsJson: "not-json" })
);
assert(!badJson.ok && badJson.reason === "invalid_cart_metadata", "invalid JSON rejected");

assert(formatOrderReference("abcdef12-3456-7890-abcd-ef1234567890") === "ABCDEF12", "order ref");

const html = buildStoreOrderConfirmationEmailHtml({
  to: "abby.pfriedman@gmail.com",
  orderId: "abcdef12-3456-7890-abcd-ef1234567890",
  totalCents: 1150,
  currency: "usd",
  lines: [{ productName: "Test Product", quantity: 1, unitPriceCents: 800, shippingTier: "standard" }],
  shipping: {
    name: "Abby Friedman",
    address: {
      line1: "3777 Montford Dr",
      city: "Atlanta",
      state: "GA",
      postal_code: "30341",
      country: "US",
    },
  },
});

assert(html.includes("Order Confirmed"), "confirmation email has title");
assert(html.includes("Abby Friedman"), "confirmation email has shipping name");
assert(html.includes("$11.50"), "confirmation email has total");

console.log("OK: Smart Store webhook metadata + confirmation email verified.");
