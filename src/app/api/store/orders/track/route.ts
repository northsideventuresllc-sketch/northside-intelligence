import { NextRequest, NextResponse } from "next/server";
import { ensureStoreEnv } from "@/lib/store/env";
import { getStoreOrderByReferenceAndEmail } from "@/lib/store/orders";
import { formatOrderReference } from "@/lib/store/checkout-session";
import { formatStoreOrderStatusLabel, resolveOrderTrackingUrl } from "@/lib/store/tracking";

export async function GET(req: NextRequest) {
  await ensureStoreEnv();

  const ref = req.nextUrl.searchParams.get("ref")?.trim();
  const email = req.nextUrl.searchParams.get("email")?.trim();

  if (!ref || !email) {
    return NextResponse.json({ error: "Order reference and email are required." }, { status: 400 });
  }

  const order = await getStoreOrderByReferenceAndEmail(ref, email);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      ref: formatOrderReference(order.id),
      status: order.status,
      statusLabel: formatStoreOrderStatusLabel(order.status),
      customerEmail: order.customerEmail,
      guestCheckout: order.guestCheckout,
      totalCents: order.totalCents,
      currency: order.currency,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      trackingUrl: resolveOrderTrackingUrl({
        trackingUrl: order.trackingUrl,
        trackingCarrier: order.trackingCarrier,
        trackingNumber: order.trackingNumber,
      }),
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      items: order.items,
    },
  });
}
