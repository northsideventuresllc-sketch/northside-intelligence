import type { CatalogProductView } from "@/lib/store/catalog/types";

export interface StoreAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StoreAssistantSearchIntent {
  searchTerms: string[];
  category?: string;
  maxRetailCents?: number;
  minRetailCents?: number;
}

export interface StoreAssistantResponse {
  message: string;
  recommendations: CatalogProductView[];
  searchQuery?: string;
}
