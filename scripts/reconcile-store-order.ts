/**
 * Reconcile a paid store order via the internal reconcile API.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/reconcile-store-order.ts [order_id] [--dry-run] [--charge-failure-email=email]
 */
import { hydrateScriptEnv } from "./lib/load-platform-secrets";

const DEFAULT_ORDER_ID = "908a8f2f-e0e9-4ee7-b71d-55083f6f5665";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

function parseArg(flag: string): string | null {
  const match = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return match ? match.slice(flag.length + 1).trim() : null;
}

async function main() {
  const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const orderId = positionalArgs[0]?.trim() || DEFAULT_ORDER_ID;
  const dryRun = process.argv.includes("--dry-run");
  const chargeFailureEmail = parseArg("--charge-failure-email");
  const reset = process.argv.includes("--reset");

  await hydrateScriptEnv(["SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"]);

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) throw new Error("CRON_SECRET missing");

  const res = await fetch(`${APP_URL}/api/store/orders/reconcile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cronSecret}`,
    },
    body: JSON.stringify({
      orderId,
      dryRun,
      resetReconciliation: reset,
      chargeFailureEmailOverride: chargeFailureEmail ?? undefined,
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  console.log(JSON.stringify(json, null, 2));
  if (!res.ok || json.error) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
