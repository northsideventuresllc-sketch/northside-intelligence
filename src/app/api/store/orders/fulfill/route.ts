import { NextRequest, NextResponse } from "next/server";
import { ensureStoreEnv } from "@/lib/store/env";
import { fulfillStoreOrder } from "@/lib/store/fulfill-order";
import { getCjAccountBalance } from "@/lib/store/sources/cj-orders";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || authHeader !== `Bearer ${secret}`) return false;
  return true;
}

export async function POST(req: NextRequest) {
  await ensureStoreEnv();

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    orderId?: string;
    stripeCheckoutSessionId?: string;
    stripePaymentIntentId?: string | null;
    notifyMake?: boolean;
    skipIfCjExists?: boolean;
    includeBalance?: boolean;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  try {
    const result = await fulfillStoreOrder({
      orderId,
      stripeCheckoutSessionId: body.stripeCheckoutSessionId?.trim() || "manual-fulfill",
      stripePaymentIntentId: body.stripePaymentIntentId ?? null,
      notifyMake: body.notifyMake,
      skipIfCjExists: body.skipIfCjExists,
    });

    const balance = body.includeBalance ? await getCjAccountBalance() : undefined;

    return NextResponse.json({
      ok: !result.error,
      ...result,
      cjAccountBalanceUsd: balance,
    });
  } catch (err) {
    console.error("[store/orders/fulfill]", err);
    const message = err instanceof Error ? err.message : "Fulfillment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
