/**
 * Competitive market reference rates (USD cents) — what comparable providers typically charge.
 * NI quotes are generated 1–2% below these benchmarks.
 */
export const SERVICE_MARKET_RATES_CENTS: Record<string, number> = {
  "tailored-intelligence-server": 4500000, // ~$45,000 avg enterprise build
  "intelligence-audit": 360000, // ~$3,600
  "personal-intelligence-setup": 165000, // ~$1,650
  "ai-research-assistant": 98000, // ~$980
  "personal-knowledge-base": 140000, // ~$1,400
  "executive-briefing-intelligence": 320000, // ~$3,200 annual equivalent
  "enterprise-ai-strategy": 1580000, // ~$15,800
  "workflow-integration": 880000, // ~$8,800
  "ai-governance-compliance": 1250000, // ~$12,500
  "team-intelligence-training": 480000, // ~$4,800
};

/** Individual clients receive lower pricing — personal-use scope is narrower. */
export const INDIVIDUAL_PRICE_MULTIPLIER = 0.68;

/** Business / enterprise full-scope multiplier baseline. */
export const BUSINESS_PRICE_MULTIPLIER = 1.0;

/** NI undercuts market by 1.5% on the initial (highest) quote. */
export const COMPETITIVE_DISCOUNT = 0.015;

/** Floor as fraction of top quote — absolute lowest before support override. */
export const FLOOR_RATIO = 0.58;

/** Negotiation tier discounts from initial quote. */
export const NEGOTIATION_TIERS = [
  { level: 0, label: "Initial Quote", multiplier: 1.0 },
  { level: 1, label: "First Negotiation", multiplier: 0.88 },
  { level: 2, label: "Second Negotiation", multiplier: 0.78 },
  { level: 3, label: "Final Offer", multiplier: FLOOR_RATIO },
] as const;

/** BNPL eligibility via Stripe (Affirm / Klarna) — typical USD limits. */
export const BNPL_MIN_CENTS = 5000; // $50
export const BNPL_MAX_CENTS = 1750000; // $17,500

/** Payment plan max months by quote amount tier. */
export function maxPaymentPlanMonths(amountCents: number): number {
  if (amountCents >= 5000000) return 24;
  if (amountCents >= 2000000) return 18;
  if (amountCents >= 1000000) return 12;
  if (amountCents >= 500000) return 6;
  if (amountCents >= 200000) return 3;
  return 1;
}

export const TEAM_SIZE_MULTIPLIERS: Record<string, number> = {
  "Just me": 1.0,
  "2–10 people": 1.12,
  "11–50 people": 1.28,
  "51–200 people": 1.52,
  "200+ people": 1.85,
};

export const TIMELINE_MULTIPLIERS: Record<string, number> = {
  "As soon as possible": 1.18,
  "Within 1–3 months": 1.08,
  "Within 3–6 months": 1.0,
  "6+ months — exploring options": 0.95,
  "Flexible / not sure yet": 1.0,
};

/** Budget ceiling — caps quote if client's stated budget is lower. */
export const BUDGET_CEILING_CENTS: Record<string, number | null> = {
  "Under $1,000": 100000,
  "$1,000 – $5,000": 500000,
  "$5,000 – $15,000": 1500000,
  "$15,000 – $50,000": 5000000,
  "$50,000 – $100,000": 10000000,
  "$100,000+": null,
  "Prefer to discuss": null,
};
