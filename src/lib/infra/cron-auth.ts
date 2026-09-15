import { createHash, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";
import { readPlatformSecret } from "@/lib/platform-secrets";

/** Timing-safe secret compare (hash first so length differences don't leak). */
function safeSecretCompare(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

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
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length);
  return safeSecretCompare(token, cronSecret);
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
  if (envSecret && safeSecretCompare(token, envSecret)) return true;

  const vaultSecret = (await readPlatformSecret("CRON_SECRET"))?.trim();
  return Boolean(vaultSecret && safeSecretCompare(token, vaultSecret));
}
