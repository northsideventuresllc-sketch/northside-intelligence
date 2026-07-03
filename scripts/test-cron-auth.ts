/**
 * Smoke test for cron auth (no server-only deps).
 * Run: npx tsx scripts/test-cron-auth.ts
 */
import { isCronAuthorized } from "../src/lib/infra/cron-auth";

function headers(map: Record<string, string>) {
  return {
    headers: {
      get: (name: string) => map[name.toLowerCase()] ?? null,
    },
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(isCronAuthorized(headers({ "x-vercel-cron": "1" })), "x-vercel-cron should authorize");
assert(!isCronAuthorized(headers({})), "empty request should reject");

process.env.CRON_SECRET = "test-secret";
assert(
  isCronAuthorized(headers({ authorization: "Bearer test-secret" })),
  "bearer CRON_SECRET should authorize"
);
assert(
  !isCronAuthorized(headers({ authorization: "Bearer wrong" })),
  "wrong bearer should reject"
);

console.log("cron-auth: ok");
