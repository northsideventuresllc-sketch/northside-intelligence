/**
 * IT MARKETING SKELETON TEMPLATE — required for every new Sector 3 IT.
 *
 * On launch of a new IT:
 *  1. Copy this file into the IT's module.
 *  2. Fill the fields below.
 *  3. Insert a row into `ni_marketing_skeletons` with the same slug
 *     (seed script: scripts/seed-marketing-skeleton.mjs — or SQL insert).
 *  4. Wire `recordSkeletonSignal()` on: signup, first payment, key engagement.
 *
 * The adapt cron (`/api/cron/marketing-skeleton-adapt`) and trend research
 * (`/api/cron/marketing-trend-research`) pick the product up automatically
 * once its skeleton row exists — add a query for the slug in
 * `src/lib/marketing-skeleton/trend-research.ts` QUERY_BY_SLUG.
 */
import type {
  MarketingAngle,
  SkeletonChannel,
} from "@/lib/marketing-skeleton/types";

export interface ITMarketingConfig {
  /** Must match ni_marketing_skeletons.product_slug and ni_tool_pricing.tool_slug */
  productSlug: string;
  sector: "3";
  /** 2-4 value props — plain language, SMB-readable, no jargon. */
  valueProps: MarketingAngle[];
  /** Launch hooks per channel. The adapt loop scores + promotes/demotes these. */
  hooks: MarketingAngle[];
  /** LinkedIn-first per NI Marketing rules (no Twitter, no Truth Social). */
  channels: SkeletonChannel[];
  /** Search query for the trend-research cron. */
  trendQuery: string;
  /** Launch goal, e.g. { metric: "active_users", target: 3, deadline: "..." } */
  goal: { metric: string; target: number; deadline?: string };
}

export const IT_MARKETING_TEMPLATE: ITMarketingConfig = {
  productSlug: "REPLACE_ME",
  sector: "3",
  valueProps: [
    { id: "vp1", text: "REPLACE: outcome the buyer gets", score: 0, status: "active" },
  ],
  hooks: [
    {
      id: "h1",
      text: "REPLACE: pain-first hook",
      channel: "linkedin",
      score: 0,
      status: "active",
      source: "seed",
    },
  ],
  channels: [
    { channel: "linkedin", priority: 1, cadence: "rotation" },
    { channel: "reddit", priority: 2, cadence: "weekly_value_post" },
  ],
  trendQuery: "REPLACE: <niche> trends what works",
  goal: { metric: "active_users", target: 3 },
};
