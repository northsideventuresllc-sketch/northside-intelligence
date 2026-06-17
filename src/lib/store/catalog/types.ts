/** Client-safe catalog product — never includes supplier cost or source URL. */
export interface CatalogProductView {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  tags: string[];
  retailPriceCents: number;
  currency: string;
  estimatedDeliveryDays: number;
  reviewRating: number | null;
  reviewCount: number;
  sourcePlatform: string;
  viralRank?: number;
  viralScore?: number;
  personalized?: boolean;
}

export interface ViralPicksResponse {
  picks: CatalogProductView[];
  pickDate: string;
  personalized: boolean;
  resetsAt: string;
  webTrackingEnabled: boolean;
}
