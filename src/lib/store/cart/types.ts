export type ShippingTier = "standard" | "expedited";

export interface CartLineItem {
  slug: string;
  name: string;
  imageUrl: string | null;
  retailPriceCents: number;
  currency: string;
  sourcePlatform: string;
  sourceProductId: string | null;
  quantity: number;
  shippingTier: ShippingTier;
}

export interface CartState {
  items: CartLineItem[];
}

export const CART_STORAGE_KEY = "ni_store_cart_v1";

export function expeditedDeliveryDays(standardDays: number): number {
  return Math.max(3, Math.ceil(standardDays * 0.45));
}

export function expeditedShippingPremiumCents(standardShippingCents: number): number {
  return Math.round(standardShippingCents * 1.5);
}
