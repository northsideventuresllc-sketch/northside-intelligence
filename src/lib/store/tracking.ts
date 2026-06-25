import { formatOrderReference } from "@/lib/store/checkout-session";

export type StoreOrderStatus =
  | "pending"
  | "paid"
  | "fulfillment_sent"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

export function storeAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";
}

export function buildStoreOrderTrackUrl(orderId: string, customerEmail: string): string {
  const base = storeAppBaseUrl();
  const ref = formatOrderReference(orderId);
  const email = encodeURIComponent(customerEmail.trim().toLowerCase());
  return `${base}/store/track?ref=${ref}&email=${email}`;
}

export function buildCarrierTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string
): string | null {
  const number = trackingNumber.trim();
  if (!number) return null;

  const normalized = carrier?.trim().toLowerCase() ?? "";
  if (normalized.includes("usps")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(number)}`;
  }
  if (normalized.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${encodeURIComponent(number)}`;
  }
  if (normalized.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(number)}`;
  }
  if (normalized.includes("dhl")) {
    return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(number)}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier ?? ""} ${number}`.trim())}`;
}

export function resolveOrderTrackingUrl(input: {
  trackingUrl?: string | null;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
}): string | null {
  const explicit = input.trackingUrl?.trim();
  if (explicit) return explicit;

  const number = input.trackingNumber?.trim();
  if (!number) return null;

  return buildCarrierTrackingUrl(input.trackingCarrier, number);
}

export function formatStoreOrderStatusLabel(status: StoreOrderStatus): string {
  switch (status) {
    case "paid":
      return "Order Confirmed";
    case "fulfillment_sent":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}
