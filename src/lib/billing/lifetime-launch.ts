import { createServiceClient } from "@/lib/supabase/server";

/** Minimum registered portal users before the lifetime window can open. */
export const LIFETIME_LAUNCH_MIN_USERS = 5;

/** Lifetime offers are available for this many days after launch starts. */
export const LIFETIME_LAUNCH_WINDOW_DAYS = 7;

export interface LifetimeLaunchStatus {
  /** True when lifetime checkout is allowed right now. */
  active: boolean;
  /** Manual gate — set LIFETIME_LAUNCH_ENABLED=true when ready to go live. */
  enabled: boolean;
  platformUserCount: number;
  minUsersRequired: number;
  windowStartAt: string | null;
  windowEndsAt: string | null;
  reason: string;
}

function parseLaunchStartAt(): Date | null {
  const raw = process.env.LIFETIME_LAUNCH_START_AT?.trim();
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isLifetimeLaunchEnabledFlag(): boolean {
  return process.env.LIFETIME_LAUNCH_ENABLED === "true";
}

export async function getPlatformUserCount(): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("ni_portal_profiles")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function evaluateLifetimeLaunchStatus(
  platformUserCount: number,
  now: Date = new Date()
): LifetimeLaunchStatus {
  const enabled = isLifetimeLaunchEnabledFlag();
  const windowStart = parseLaunchStartAt();
  const windowEndsAt = windowStart
    ? new Date(
        windowStart.getTime() + LIFETIME_LAUNCH_WINDOW_DAYS * 24 * 60 * 60 * 1000
      )
    : null;

  if (!enabled) {
    return {
      active: false,
      enabled: false,
      platformUserCount,
      minUsersRequired: LIFETIME_LAUNCH_MIN_USERS,
      windowStartAt: windowStart?.toISOString() ?? null,
      windowEndsAt: windowEndsAt?.toISOString() ?? null,
      reason: "Lifetime launch is not enabled yet.",
    };
  }

  if (platformUserCount < LIFETIME_LAUNCH_MIN_USERS) {
    return {
      active: false,
      enabled: true,
      platformUserCount,
      minUsersRequired: LIFETIME_LAUNCH_MIN_USERS,
      windowStartAt: windowStart?.toISOString() ?? null,
      windowEndsAt: windowEndsAt?.toISOString() ?? null,
      reason: `Lifetime launch unlocks at ${LIFETIME_LAUNCH_MIN_USERS} platform users (${platformUserCount} today).`,
    };
  }

  if (!windowStart) {
    return {
      active: false,
      enabled: true,
      platformUserCount,
      minUsersRequired: LIFETIME_LAUNCH_MIN_USERS,
      windowStartAt: null,
      windowEndsAt: null,
      reason: "Set LIFETIME_LAUNCH_START_AT to open the one-week lifetime window.",
    };
  }

  if (now < windowStart) {
    return {
      active: false,
      enabled: true,
      platformUserCount,
      minUsersRequired: LIFETIME_LAUNCH_MIN_USERS,
      windowStartAt: windowStart.toISOString(),
      windowEndsAt: windowEndsAt?.toISOString() ?? null,
      reason: "Lifetime window has not started yet.",
    };
  }

  if (windowEndsAt && now > windowEndsAt) {
    return {
      active: false,
      enabled: true,
      platformUserCount,
      minUsersRequired: LIFETIME_LAUNCH_MIN_USERS,
      windowStartAt: windowStart.toISOString(),
      windowEndsAt: windowEndsAt.toISOString(),
      reason: "Lifetime launch window has ended.",
    };
  }

  return {
    active: true,
    enabled: true,
    platformUserCount,
    minUsersRequired: LIFETIME_LAUNCH_MIN_USERS,
    windowStartAt: windowStart.toISOString(),
    windowEndsAt: windowEndsAt?.toISOString() ?? null,
    reason: "Lifetime launch is active.",
  };
}

export async function getLifetimeLaunchStatus(): Promise<LifetimeLaunchStatus> {
  const platformUserCount = await getPlatformUserCount();
  return evaluateLifetimeLaunchStatus(platformUserCount);
}
