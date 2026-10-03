/** User subscription tier stored in Supabase (`replyflow_profiles.plan`). */
export type UserPlan = "free" | "solo" | "team" | "agency";

/** Deployment tier from env — caps limits for all users on this instance. */
export type DeploymentTier = "lite" | "pro";

const USER_PLANS: UserPlan[] = ["free", "solo", "team", "agency"];

export function getDeploymentTier(): DeploymentTier {
  return process.env.TIER === "lite" ? "lite" : "pro";
}

export function normalizeUserPlan(plan: string | null | undefined): UserPlan {
  if (plan && USER_PLANS.includes(plan as UserPlan)) return plan as UserPlan;
  return "free";
}

export function getPlanLimits(deployment: DeploymentTier): Record<UserPlan, number> {
  const isLite = deployment === "lite";
  return {
    free: isLite ? 5 : 10,
    solo: isLite ? 25 : 100,
    team: isLite ? 100 : 1000,
    agency: isLite ? 250 : 999999,
  };
}

export const PLAN_LABELS: Record<UserPlan, string> = {
  free: "Free",
  solo: "Solo",
  team: "Team",
  agency: "Agency",
};

export interface ReplyFlowTierPlan {
  name: string;
  description: string;
  priceMonthlyUsd: number;
  features: string[];
}

export const REPLYFLOW_TIERS: Record<"core" | "done_with_you", ReplyFlowTierPlan> = {
  core: {
    name: "Core SaaS",
    description: "Autonomous customer reply drafting and inbox triage for founders and operators.",
    priceMonthlyUsd: 149,
    features: [
      "Full ReplyFlow web dashboard & analytics",
      "Unlimited AI reply generation & auto-drafting",
      "Email & support ticket integration",
      "Custom brand voice & sentiment tuning",
      "Standard email & chat support",
    ],
  },
  done_with_you: {
    name: "Done-With-You",
    description: "Guided onboarding, customized prompt engineering, and custom webhook integration.",
    priceMonthlyUsd: 299,
    features: [
      "Everything in Core SaaS",
      "Dedicated 1-on-1 onboarding & prompt audit",
      "Custom workflow & ticketing system integration",
      "Priority SLA and engineering channel support",
      "Bi-weekly performance & accuracy reviews",
    ],
  },
};
