import { NextRequest, NextResponse } from "next/server";
import { ensureStoreEnv } from "@/lib/store/env";
import { updateStoreOrderFulfillment } from "@/lib/store/orders";

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
    status?: "fulfillment_sent" | "shipped" | "delivered";
    trackingNumber?: string | null;
    trackingCarrier?: string | null;
    trackingUrl?: string | null;
    sendCustomerEmail?: boolean;
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
    const order = await updateStoreOrderFulfillment({
      orderId,
      status: body.status,
      trackingNumber: body.trackingNumber ?? null,
      trackingCarrier: body.trackingCarrier ?? null,
      trackingUrl: body.trackingUrl ?? null,
      sendCustomerEmail: body.sendCustomerEmail,
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        status: order.status,
        trackingNumber: order.trackingNumber,
        trackingCarrier: order.trackingCarrier,
        trackingUrl: order.trackingUrl,
      },
    });
  } catch (err) {
    console.error("[store/orders/fulfillment]", err);
    const message = err instanceof Error ? err.message : "Fulfillment update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
