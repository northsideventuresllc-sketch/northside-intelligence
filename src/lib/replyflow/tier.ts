/** User subscription tier stored in Supabase (`replyflow_profiles.plan`). */
export type UserPlan = "core" | "done_with_you" | "free" | "solo" | "team" | "agency";

/** Active public subscription tier configuration */
export interface ReplyFlowTierConfig {
  id: "core" | "done_with_you";
  name: string;
  priceMonthlyUsd: number;
  description: string;
  features: string[];
}

export const REPLYFLOW_TIERS: Record<"core" | "done_with_you", ReplyFlowTierConfig> = {
  core: {
    id: "core",
    name: "SaaS Access",
    priceMonthlyUsd: 15,
    description: "Self-serve AI customer reply automation — you run it yourself, no implementation needed.",
    features: [
      "Unlimited AI reply generation",
      "Tone & scenario customization",
      "One-click response copy & editing",
      "Full reply history & session reload",
    ],
  },
  done_with_you: {
    id: "done_with_you",
    name: "Agentic Access",
    priceMonthlyUsd: 149.99,
    description: "Done-with-you implementation: custom voice calibration and dedicated workflow integrations, set up in your systems by our team.",
    features: [
      "Everything in Core",
      "Custom brand voice & persona calibration",
      "Dedicated workflow & MCP integration (Gmail, Zendesk, Slack)",
      "Monthly strategy & response tuning",
    ],
  },
};

/** Deployment tier from env — caps limits for all users on this instance. */
export type DeploymentTier = "lite" | "pro";

const USER_PLANS: UserPlan[] = ["core", "done_with_you", "free", "solo", "team", "agency"];

export function getDeploymentTier(): DeploymentTier {
  return process.env.TIER === "lite" ? "lite" : "pro";
}

export function normalizeUserPlan(plan: string | null | undefined): UserPlan {
  if (plan === "done-with-you") return "done_with_you";
  if (plan && USER_PLANS.includes(plan as UserPlan)) return plan as UserPlan;
  return "core";
}

export function getPlanLimits(deployment: DeploymentTier): Record<UserPlan, number> {
  const isLite = deployment === "lite";
  return {
    core: isLite ? 500 : 999999,
    done_with_you: 999999,
    free: 10, // Free tier baseline (10 replies/month)
    solo: isLite ? 25 : 100,
    team: isLite ? 100 : 1000,
    agency: isLite ? 250 : 999999,
  };
}

export const PLAN_LABELS: Record<UserPlan, string> = {
  core: "Core",
  done_with_you: "Done-With-You",
  free: "Free Tier",
  solo: "Solo (Legacy)",
  team: "Team (Legacy)",
  agency: "Agency (Legacy)",
};
