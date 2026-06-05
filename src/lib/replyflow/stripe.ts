import Stripe from "stripe";
import { getDeploymentTier, getPlanLimits, type UserPlan } from "@/lib/replyflow/tier";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
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
