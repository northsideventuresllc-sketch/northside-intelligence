export interface SearchHistoryItem {
  id: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  retailPriceCents: number | null;
  viewedAt: string;
}

export interface WishlistItem {
  id: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  retailPriceCents: number | null;
  variantId: string | null;
  createdAt: string;
}

export interface PriceWatchItem {
  id: string;
  productSlug: string;
  productName: string;
  variantId: string | null;
  baselineRetailCents: number;
  lastKnownRetailCents: number;
  active: boolean;
  createdAt: string;
}
