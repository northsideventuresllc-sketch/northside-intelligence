import Stripe from "stripe";
import type { BillingInterval, NiTier } from "@/lib/billing/ni-tiers";
import { normalizeNiTier } from "@/lib/billing/ni-tiers";

let stripeClient: Stripe | null = null;

export function getBillingConfigError(): string | null {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return "Billing is not configured yet. Please try again shortly.";
  }
  return null;
}

export function getBillingStripe(): Stripe {
  const configError = getBillingConfigError();
  if (configError) throw new Error("STRIPE_SECRET_KEY is not configured");
  const key = process.env.STRIPE_SECRET_KEY!;
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
  core: {
    monthly: "STRIPE_NI_CORE_MONTHLY_PRICE_ID",
    annual: "STRIPE_NI_CORE_ANNUAL_PRICE_ID",
  },
  pro: {
    monthly: "STRIPE_NI_PRO_MONTHLY_PRICE_ID",
    annual: "STRIPE_NI_PRO_ANNUAL_PRICE_ID",
  },
  power: {
    monthly: "STRIPE_NI_POWER_MONTHLY_PRICE_ID",
    annual: "STRIPE_NI_POWER_ANNUAL_PRICE_ID",
  },
  // Legacy env keys (pre Core/Pro/Power rename)
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

export interface NiPlanPricing {
  tier: NiTier;
  stripeMonthlyPriceId: string | null;
  stripeAnnualPriceId: string | null;
}

export function mapNiPlanPricing(row: Record<string, unknown>): NiPlanPricing {
  return {
    tier: normalizeNiTier(String(row.tier)),
    stripeMonthlyPriceId: (row.stripe_monthly_price_id as string) ?? null,
    stripeAnnualPriceId: (row.stripe_annual_price_id as string) ?? null,
  };
}

function niPriceFromEnv(tier: string, interval: BillingInterval): string | null {
  const keys = NI_SUBSCRIPTION_PRICE_ENV[tier];
  if (!keys) return null;
  return envPrice(interval === "monthly" ? keys.monthly : keys.annual) ?? null;
}

export function getNiSubscriptionPriceId(
  tier: NiTier,
  interval: BillingInterval,
  planPricing?: NiPlanPricing[]
): string | null {
  const fromDb = planPricing?.find((p) => p.tier === tier);
  if (fromDb) {
    const priceId =
      interval === "monthly" ? fromDb.stripeMonthlyPriceId : fromDb.stripeAnnualPriceId;
    if (priceId) return priceId;
  }
  return niPriceFromEnv(tier, interval);
}

export function getNiTierFromPriceId(
  priceId: string | undefined,
  planPricing?: NiPlanPricing[]
): {
  tier: NiTier;
  interval: BillingInterval;
} | null {
  if (!priceId) return null;

  if (planPricing) {
    for (const plan of planPricing) {
      if (priceId === plan.stripeMonthlyPriceId) {
        return { tier: plan.tier, interval: "monthly" };
      }
      if (priceId === plan.stripeAnnualPriceId) {
        return { tier: plan.tier, interval: "annual" };
      }
    }
  }

  for (const tier of ["core", "pro", "power", "standard", "premium", "ultimate"] as const) {
    const monthly = niPriceFromEnv(tier, "monthly");
    const annual = niPriceFromEnv(tier, "annual");
    const normalized = normalizeNiTier(tier);
    if (priceId === monthly) return { tier: normalized, interval: "monthly" };
    if (priceId === annual) return { tier: normalized, interval: "annual" };
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
