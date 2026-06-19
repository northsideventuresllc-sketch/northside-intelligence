import type { CartLineItem } from "@/lib/store/cart/types";
import { expeditedShippingPremiumCents } from "@/lib/store/cart/types";
import { estimateShippingCents } from "@/lib/store/pricing";

export interface CartTotals {
  subtotalCents: number;
  shippingCents: number;
  shippingEstimateCents: number;
  totalCents: number;
  hasExpedited: boolean;
}

export function calculateCartTotals(items: CartLineItem[]): CartTotals {
  const subtotalCents = items.reduce((sum, item) => sum + item.retailPriceCents * item.quantity, 0);
  const baseShipping = estimateShippingCents(subtotalCents);
  const hasExpedited = items.some((item) => item.shippingTier === "expedited");
  const shippingEstimateCents = baseShipping;
  const shippingCents = hasExpedited
    ? baseShipping + expeditedShippingPremiumCents(baseShipping)
    : baseShipping;

  return {
    subtotalCents,
    shippingCents,
    shippingEstimateCents,
    totalCents: subtotalCents + shippingCents,
    hasExpedited,
  };
}
