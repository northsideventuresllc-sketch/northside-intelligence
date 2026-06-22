/** Client-safe catalog product — never includes supplier cost or source URL. */
export interface CatalogVariantView {
  id: string;
  name: string;
  retailPriceCents: number;
  imageUrl: string | null;
}

export interface PriceChangeNoticeView {
  slug: string;
  name: string;
  previousRetailCents: number;
  currentRetailCents: number;
  reason: string;
}

export interface CatalogProductView {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  imageIsStockPhoto?: boolean;
  category: string;
  tags: string[];
  retailPriceCents: number;
  retailPriceMinCents?: number | null;
  retailPriceMaxCents?: number | null;
  currency: string;
  estimatedDeliveryDays: number;
  reviewRating: number | null;
  reviewCount: number;
  sourcePlatform: string;
  variants?: CatalogVariantView[];
  viralRank?: number;
  viralScore?: number;
  personalized?: boolean;
  priceChangeNotice?: PriceChangeNoticeView;
}

export interface ViralPicksResponse {
  picks: CatalogProductView[];
  pickDate: string;
  personalized: boolean;
  resetsAt: string;
  webTrackingEnabled: boolean;
}

export interface PopularPicksResponse {
  picks: CatalogProductView[];
  pickDate: string;
  resetsAt: string;
}

export interface StoreSearchResponse {
  results: CatalogProductView[];
  total: number;
  page: number;
  limit: number;
  query: string;
  platforms: string[];
  categories: string[];
  priceChangeNotices?: PriceChangeNoticeView[];
}
