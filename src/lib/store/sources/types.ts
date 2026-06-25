import "server-only";

export type DropshipPlatform = "cj";

export interface CatalogVariantView {
  id: string;
  name: string;
  retailPriceCents: number;
  imageUrl: string | null;
  description?: string;
}

export interface SourceProductDraft {
  name: string;
  description: string;
  imageUrl: string;
  imageSource: "cj" | "serpapi";
  category: string;
  tags: string[];
  sourcePlatform: DropshipPlatform;
  sourceProductId: string;
  supplierCostCents: number;
  supplierCostMinCents: number;
  supplierCostMaxCents: number;
  retailPriceMinCents: number;
  retailPriceMaxCents: number;
  variants: CatalogVariantView[];
  estimatedDeliveryDays: number;
}

export interface StoreSearchFilters {
  query: string;
  platforms: DropshipPlatform[];
  category?: string;
  minRetailCents?: number;
  maxRetailCents?: number;
  page: number;
  limit: number;
  surprise?: boolean;
  surpriseSeed?: string;
}

export interface PriceChangeNotice {
  slug: string;
  name: string;
  previousRetailCents: number;
  currentRetailCents: number;
  reason: string;
}
