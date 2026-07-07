import type { NextRequest } from "next/server";
import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";
import { readPlatformSecret } from "@/lib/platform-secrets";

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

/**
 * Async cron auth — hydrates env + accepts canonical ni_platform_secrets CRON_SECRET.
 * Hermes GitHub Actions triggers use vault Bearer; Vercel env may drift.
 */
export async function isCronAuthorizedAsync(
  req: Pick<NextRequest, "headers">,
): Promise<boolean> {
  if (isCronAuthorized(req)) return true;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length);

  await hydratePlatformEnvFromDatabase();
  const envSecret = process.env.CRON_SECRET?.trim();
  if (envSecret && token === envSecret) return true;

  const vaultSecret = await readPlatformSecret("CRON_SECRET");
  return Boolean(vaultSecret?.trim() && token === vaultSecret.trim());
}
