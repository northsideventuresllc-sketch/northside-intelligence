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

export function getPlanFromPriceId(priceId: string | undefined): UserPlan {
  const map: Record<string, UserPlan> = {
    [process.env.STRIPE_SOLO_PRICE_ID!]: "solo",
    [process.env.STRIPE_TEAM_PRICE_ID!]: "team",
    [process.env.STRIPE_AGENCY_PRICE_ID!]: "agency",
  };
  if (!priceId) return "free";
  return map[priceId] ?? "free";
}
