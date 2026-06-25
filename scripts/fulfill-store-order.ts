/**
 * Submit a paid NI store order to CJ Dropshipping via the internal fulfill API.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/fulfill-store-order.ts [order_id] [--force]
 */
import { hydrateScriptEnv } from "./lib/load-platform-secrets";

const DEFAULT_ORDER_ID = "908a8f2f-e0e9-4ee7-b71d-55083f6f5665";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

async function main() {
  const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const orderId = positionalArgs[0]?.trim() || DEFAULT_ORDER_ID;
  const force = process.argv.includes("--force");

  await hydrateScriptEnv(["SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"]);

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) throw new Error("CRON_SECRET missing");

  const res = await fetch(`${APP_URL}/api/store/orders/fulfill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cronSecret}`,
    },
    body: JSON.stringify({
      orderId,
      skipIfCjExists: !force,
      notifyMake: true,
      includeBalance: true,
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
