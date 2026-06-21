import Stripe from "stripe";
import { getDeploymentTier, getPlanLimits, type UserPlan } from "@/lib/replyflow/tier";
import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";

let stripeClient: Stripe | null = null;
let hydrateAttempted = false;

export async function ensureReplyflowBillingEnvHydrated(): Promise<void> {
  if (hydrateAttempted && process.env.STRIPE_SECRET_KEY?.trim()) return;
  hydrateAttempted = true;
  await hydratePlatformEnvFromDatabase();
}

export function getBillingConfigError(): string | null {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return "Billing is not configured yet. Please try again shortly.";
  }
  return null;
}

export function getStripe(): Stripe {
  const configError = getBillingConfigError();
  if (configError) throw new Error("STRIPE_SECRET_KEY is not configured");
  const key = process.env.STRIPE_SECRET_KEY!;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" });
  }
  return stripeClient;
}

/** @deprecated Use getStripe() — kept for webhook/checkout routes */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});

export const PLAN_LIMITS = getPlanLimits(getDeploymentTier());

export { PLAN_LABELS } from "@/lib/replyflow/tier";

/**
 * Single source of truth for plan <-> Stripe price ID. Checkout (creating the
 * session) and the webhook (resolving the paid plan) must use the exact same
 * mapping, or a real payment can silently resolve to "free" with no error.
 */
export const REPLYFLOW_PRICE_IDS: Record<"solo" | "team" | "agency", string> = {
  solo: process.env.STRIPE_SOLO_PRICE_ID ?? "price_1Te0s8QXb5thRQWgqVQdW8Rl",
  team: process.env.STRIPE_TEAM_PRICE_ID ?? "price_1Te0sBQXb5thRQWgYzuWMxTd",
  agency: process.env.STRIPE_AGENCY_PRICE_ID ?? "price_1Te0sEQXb5thRQWgCiAzrClk",
};

export function getPlanFromPriceId(priceId: string | undefined): UserPlan {
  if (!priceId) return "free";
  const match = (Object.entries(REPLYFLOW_PRICE_IDS) as [UserPlan, string][]).find(
    ([, id]) => id === priceId
  );
  if (!match) {
    console.error("[replyflow/stripe] Unrecognized Stripe price ID — defaulting to free plan", {
      priceId,
    });
    return "free";
  }
  return match[0];
}
