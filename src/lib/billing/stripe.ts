import Stripe from "stripe";
import type { BillingInterval, NiTier } from "@/lib/billing/ni-tiers";

let stripeClient: Stripe | null = null;

export function getBillingStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" });
  }
  return stripeClient;
}

export const billingStripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getBillingStripe(), prop);
  },
});

export type CheckoutKind =
  | { type: "ni_subscription"; tier: NiTier; interval: BillingInterval }
  | { type: "tool_subscription"; toolSlug: string; interval: BillingInterval }
  | { type: "tool_lifetime"; toolSlug: string };

function envPrice(key: string): string | undefined {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

const NI_SUBSCRIPTION_PRICE_ENV: Record<
  string,
  { monthly: string; annual: string }
> = {
  standard: {
    monthly: "STRIPE_NI_STANDARD_MONTHLY_PRICE_ID",
    annual: "STRIPE_NI_STANDARD_ANNUAL_PRICE_ID",
  },
  premium: {
    monthly: "STRIPE_NI_PREMIUM_MONTHLY_PRICE_ID",
    annual: "STRIPE_NI_PREMIUM_ANNUAL_PRICE_ID",
  },
  ultimate: {
    monthly: "STRIPE_NI_ULTIMATE_MONTHLY_PRICE_ID",
    annual: "STRIPE_NI_ULTIMATE_ANNUAL_PRICE_ID",
  },
};

export function getNiSubscriptionPriceId(tier: NiTier, interval: BillingInterval): string | null {
  const keys = NI_SUBSCRIPTION_PRICE_ENV[tier];
  if (!keys) return null;
  return envPrice(interval === "monthly" ? keys.monthly : keys.annual) ?? null;
}

export function getNiTierFromPriceId(priceId: string | undefined): {
  tier: NiTier;
  interval: BillingInterval;
} | null {
  if (!priceId) return null;
  for (const tier of ["standard", "premium", "ultimate"] as NiTier[]) {
    const keys = NI_SUBSCRIPTION_PRICE_ENV[tier];
    const monthly = envPrice(keys.monthly);
    const annual = envPrice(keys.annual);
    if (priceId === monthly) return { tier, interval: "monthly" };
    if (priceId === annual) return { tier, interval: "annual" };
  }
  return null;
}

export function getToolPriceIdFromDb(
  pricing: {
    stripeMonthlyPriceId: string | null;
    stripeAnnualPriceId: string | null;
    stripeLifetimePriceId: string | null;
  },
  interval: BillingInterval | "lifetime"
): string | null {
  if (interval === "lifetime") return pricing.stripeLifetimePriceId;
  if (interval === "monthly") return pricing.stripeMonthlyPriceId;
  return pricing.stripeAnnualPriceId;
}

export function resolveToolCheckoutFromPriceId(
  priceId: string,
  allPricing: Array<{
    toolSlug: string;
    stripeMonthlyPriceId: string | null;
    stripeAnnualPriceId: string | null;
    stripeLifetimePriceId: string | null;
  }>
): { toolSlug: string; interval: BillingInterval | "lifetime" } | null {
  for (const p of allPricing) {
    if (p.stripeMonthlyPriceId === priceId) return { toolSlug: p.toolSlug, interval: "monthly" };
    if (p.stripeAnnualPriceId === priceId) return { toolSlug: p.toolSlug, interval: "annual" };
    if (p.stripeLifetimePriceId === priceId) return { toolSlug: p.toolSlug, interval: "lifetime" };
  }
  return null;
}
