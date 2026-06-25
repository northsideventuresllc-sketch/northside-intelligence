/**
 * Query CJ order list for a matching NI store order.
 * Usage: npx tsx scripts/check-cj-order.ts [ni_order_id] [customer_email]
 */
import { hydrateScriptEnv } from "./lib/load-platform-secrets";

const NI_ORDER_ID = process.argv[2]?.trim() || "908a8f2f-e0e9-4ee7-b71d-55083f6f5665";
const CUSTOMER_EMAIL = process.argv[3]?.trim() || "abby.pfriedman@gmail.com";

async function getCjAccessToken(apiKey: string): Promise<string> {
  const res = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
      cache: "no-store",
    }
  );
  const json = (await res.json()) as {
    result?: boolean;
    message?: string;
    data?: { accessToken?: string };
  };
  if (!res.ok || !json.result || !json.data?.accessToken) {
    throw new Error(`CJ auth failed: ${json.message ?? res.status}`);
  }
  return json.data.accessToken;
}

async function main() {
  await hydrateScriptEnv(["CJ_DROPSHIPPING_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"]);
  const apiKey = process.env.CJ_DROPSHIPPING_API_KEY?.trim();
  if (!apiKey) throw new Error("CJ_DROPSHIPPING_API_KEY missing");

  const token = await getCjAccessToken(apiKey);

  const listUrl = new URL("https://developers.cjdropshipping.com/api2.0/v1/shopping/order/list");
  listUrl.searchParams.set("pageNum", "1");
  listUrl.searchParams.set("pageSize", "100");

  const listRes = await fetch(listUrl, {
    headers: { "CJ-Access-Token": token },
  });
  const listJson = (await listRes.json()) as {
    result?: boolean;
    message?: string;
    data?: { list?: unknown[] } | unknown[];
  };

  if (!listRes.ok || listJson.result === false) {
    throw new Error(`CJ order list failed: ${listJson.message ?? listRes.status}`);
  }

  const orders = Array.isArray(listJson.data)
    ? listJson.data
    : ((listJson.data as { list?: unknown[] })?.list ?? []);

  const needle = [
    NI_ORDER_ID.toLowerCase(),
    NI_ORDER_ID.slice(0, 8).toLowerCase(),
    CUSTOMER_EMAIL.toLowerCase(),
    "abby",
    "montford",
    "908a8f2f",
  ];

  const matches = orders.filter((entry) => {
    const blob = JSON.stringify(entry).toLowerCase();
    return needle.some((n) => blob.includes(n));
  });

  console.log(
    JSON.stringify(
      {
        cjAuth: "ok",
        ordersScanned: orders.length,
        matchCount: matches.length,
        matches: matches.map((o) => {
          const row = o as Record<string, unknown>;
          return {
            orderId: row.orderId ?? row.cjOrderId ?? row.id,
            orderNum: row.orderNum ?? row.orderNumber,
            status: row.orderStatus ?? row.status,
            email: row.email ?? row.customerEmail ?? row.buyerEmail,
            shippingCountry: row.shippingCountryCode ?? row.countryCode,
            createDate: row.createDate ?? row.createdAt,
            trackNumber: row.trackNumber ?? row.trackingNumber,
            remark: row.remark ?? row.note,
          };
        }),
        recentIfNoMatch: matches.length
          ? undefined
          : orders.slice(0, 5).map((o) => {
              const row = o as Record<string, unknown>;
              return {
                orderId: row.orderId ?? row.cjOrderId,
                status: row.orderStatus ?? row.status,
                email: row.email ?? row.customerEmail,
                createDate: row.createDate,
              };
            }),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
