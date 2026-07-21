export type AngleStatus = "active" | "winning" | "losing" | "retired";

export interface MarketingAngle {
  id: string;
  text: string;
  channel?: string;
  score: number;
  status: AngleStatus;
  source?: string; // seed | trend-research | manual | adapt
}

export interface SkeletonChannel {
  channel: string;
  priority: number;
  cadence: string;
  notes?: string;
}

export interface TrendNote {
  date: string;
  note: string;
  source_url?: string;
}

export interface MarketingSkeleton {
  id: string;
  product_slug: string;
  sector: string;
  brand: "ni" | "match-fit";
  version: number;
  status: "active" | "paused";
  value_props: MarketingAngle[];
  hooks: MarketingAngle[];
  channels: SkeletonChannel[];
  audiences: MarketingAngle[];
  offers: MarketingAngle[];
  winning_angles: string[];
  losing_angles: string[];
  trend_notes: TrendNote[];
  goals: { metric?: string; target?: number; deadline?: string };
  last_adapted_at: string | null;
  last_research_at: string | null;
}

export type SkeletonSignalType =
  | "revenue"
  | "signup"
  | "engagement"
  | "ad"
  | "store_event"
  | "content"
  | "trend";
