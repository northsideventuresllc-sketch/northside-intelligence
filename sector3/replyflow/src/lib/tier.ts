/** User subscription tier stored in Supabase (`replyflow_profiles.plan`). */
export type UserPlan = 'free' | 'solo' | 'team' | 'agency'

/** Deployment tier from env — caps limits for all users on this instance. */
export type DeploymentTier = 'lite' | 'pro'

const USER_PLANS: UserPlan[] = ['free', 'solo', 'team', 'agency']

export function getDeploymentTier(): DeploymentTier {
  return process.env.TIER === 'lite' ? 'lite' : 'pro'
}

export function normalizeUserPlan(plan: string | null | undefined): UserPlan {
  if (plan && USER_PLANS.includes(plan as UserPlan)) return plan as UserPlan
  return 'free'
}

export function getPlanLimits(deployment: DeploymentTier): Record<UserPlan, number> {
  const isLite = deployment === 'lite'
  return {
    free: isLite ? 5 : 10,
    solo: isLite ? 25 : 100,
    team: isLite ? 100 : 1000,
    agency: isLite ? 250 : 999999,
  }
}

export const PLAN_LABELS: Record<UserPlan, string> = {
  free: 'Free',
  solo: 'Solo',
  team: 'Team',
  agency: 'Agency',
}
