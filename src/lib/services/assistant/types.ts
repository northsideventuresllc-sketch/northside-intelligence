import type { ServiceAudience } from "@/lib/services/offerings";

export interface ServiceAssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ServiceAssistantSearchIntent {
  searchTerms: string[];
  audience?: "individual" | "business" | "any";
  maxBudgetUsd?: number;
  minBudgetUsd?: number;
  goals?: string[];
}

export interface ServiceAssistantRecommendation {
  slug: string;
  name: string;
  description: string;
  audience: ServiceAudience;
  priceLabel: string;
  priceNote?: string;
}

export interface ServiceAssistantResponse {
  message: string;
  recommendations: ServiceAssistantRecommendation[];
  searchQuery?: string;
}
