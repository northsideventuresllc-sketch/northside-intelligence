import type { NextRequest } from "next/server";

/**
 * Authorize Vercel cron invocations and manual triggers.
 *
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` only when CRON_SECRET is set
 * on the Vercel project. NI Portal often hydrates CRON_SECRET from ni_platform_secrets
 * at runtime, so scheduled jobs must also accept `x-vercel-cron: 1`.
 */
export function isCronAuthorized(req: Pick<NextRequest, "headers">): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true;

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}
