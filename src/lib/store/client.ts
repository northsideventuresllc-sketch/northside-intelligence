import type { StoreGateStatus } from "@/lib/store/types";

/** Block checkout for mock catalog rows regardless of gate state. */
export function canCheckoutProduct(
  product: { isMock: boolean },
  gate: StoreGateStatus
): boolean {
  if (product.isMock) return false;
  return gate.live;
}

export function formatStorePrice(priceCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(priceCents / 100);
}

export type { StoreGateStatus, StoreProductView } from "@/lib/store/types";
