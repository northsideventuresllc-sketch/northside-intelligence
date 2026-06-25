/**
 * Resend Smart Store fulfillment action / payment-required email.
 *
 * Usage:
 *   npx tsx scripts/resend-store-fulfillment-action.ts [order_id] [--to=email]
 */
import { Resend } from "resend";
import { formatOrderReference } from "../src/lib/store/checkout-session";
import { buildStoreFulfillmentActionEmailHtml } from "../src/lib/store/order-emails-html";
import { buildStoreOrderTrackUrl } from "../src/lib/store/tracking";
import { hydrateScriptEnv } from "./lib/load-platform-secrets";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_ORDER_ID = "908a8f2f-e0e9-4ee7-b71d-55083f6f5665";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://kxijunwgbrlfzvgkhklo.supabase.co";

function parseArg(flag: string): string | null {
  const match = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return match ? match.slice(flag.length + 1).trim() : null;
}

async function main() {
  const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const orderId = positionalArgs[0]?.trim() || DEFAULT_ORDER_ID;
  const toOverride = parseArg("--to");

  await hydrateScriptEnv(["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY"]);

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  if (!process.env.RESEND_API_KEY?.trim()) throw new Error("RESEND_API_KEY missing");

  const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error } = await supabase
    .from("ni_store_orders")
    .select("id, customer_email, reconciliation_adjustment_cents, currency")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) throw new Error(error?.message ?? `Order not found: ${orderId}`);

  const chargeCents = Number(order.reconciliation_adjustment_cents ?? 0);
  if (chargeCents <= 0) throw new Error("Order has no outstanding adjustment amount");

  const to = (toOverride ?? "jonnybooth22@gmail.com").trim().toLowerCase();
  const orderRef = formatOrderReference(orderId);
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from =
    process.env.NI_NOREPLY_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    "Northside Intelligence <noreply@northsideintelligence.com>";

  const result = await resend.emails.send(
    {
      from,
      to: [to],
      subject: `Action Required — Order #${orderRef} | Northside Intelligence`,
      html: buildStoreFulfillmentActionEmailHtml({
        to,
        orderId,
        reason: `Additional shipping and handling of $${(chargeCents / 100).toFixed(2)} is required. Please complete payment within 72 hours.`,
        trackPageUrl: buildStoreOrderTrackUrl(orderId, to),
      }),
    },
    { idempotencyKey: `store-order-action/${orderId}/manual-resend-${Date.now()}` }
  );

  console.log(
    JSON.stringify(
      {
        orderId,
        to,
        chargeCents,
        sent: !result.error,
        error: result.error?.message ?? null,
        messageId: result.data?.id ?? null,
      },
      null,
      2
    )
  );

  if (result.error) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
