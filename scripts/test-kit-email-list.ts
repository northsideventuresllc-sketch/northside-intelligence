/**
 * Verify Kit email list credentials and form wiring.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/test-kit-email-list.ts [email]
 */
import { hydrateScriptEnv } from "./lib/load-platform-secrets";

const KIT_V3_API_BASE = "https://api.convertkit.com/v3";
const testEmail =
  process.argv[2]?.trim().toLowerCase() ?? "kit-setup-test@northsideintelligence.com";

async function main() {
  await hydrateScriptEnv(["KIT_API_KEY", "KIT_API_SECRET", "KIT_FORM_ID"]);

  const apiKey = process.env.KIT_API_KEY?.trim();
  const apiSecret = process.env.KIT_API_SECRET?.trim();
  const formId = process.env.KIT_FORM_ID?.trim();

  if (!apiKey || !apiSecret || !formId) {
    throw new Error("Missing KIT_API_KEY, KIT_API_SECRET, or KIT_FORM_ID");
  }

  console.log(`Testing Kit form ${formId} for ${testEmail}`);

  const subscribeRes = await fetch(`${KIT_V3_API_BASE}/forms/${formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, email: testEmail }),
  });
  const subscribeBody = await subscribeRes.text();
  console.log("subscribe:", subscribeRes.status, subscribeBody);

  const lookupRes = await fetch(
    `${KIT_V3_API_BASE}/subscribers?api_secret=${apiSecret}&status=all&email_address=${encodeURIComponent(testEmail)}`
  );
  const lookupBody = await lookupRes.text();
  console.log("lookup:", lookupRes.status, lookupBody);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
