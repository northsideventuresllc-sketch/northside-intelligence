import "server-only";

export type DropshipPlatform = "cj" | "spocket" | "zendrop" | "curated";

export interface SourceProductDraft {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  sourcePlatform: DropshipPlatform;
  sourceProductId: string;
  supplierCostCents: number;
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
}
