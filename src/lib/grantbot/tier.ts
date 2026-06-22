/** User subscription tier stored in Supabase (`grantbot_profiles.tier`). */
export type GrantBotTier = "free" | "lite" | "pro";

/** Deployment tier from env — caps limits for all users on this instance. */
export type DeploymentTier = "lite" | "pro";

const GRANTBOT_TIERS: GrantBotTier[] = ["free", "lite", "pro"];

export function getDeploymentTier(): DeploymentTier {
  return process.env.TIER === "lite" ? "lite" : "pro";
}

export function normalizeGrantBotTier(tier: string | null | undefined): GrantBotTier {
  if (tier && GRANTBOT_TIERS.includes(tier as GrantBotTier)) return tier as GrantBotTier;
  return "free";
}

export function getTierLimits(deployment: DeploymentTier): Record<GrantBotTier, number> {
  const isLite = deployment === "lite";
  return {
    free: isLite ? 2 : 5,
    lite: isLite ? 10 : 25,
    pro: isLite ? 50 : 999999,
  };
}

export const TIER_LABELS: Record<GrantBotTier, string> = {
  free: "Free",
  lite: "Lite",
  pro: "Pro",
};
