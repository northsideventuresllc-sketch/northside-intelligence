/**
 * Competitive market reference rates (USD cents) — what comparable providers typically charge.
 * NI quotes are generated 1–2% below these benchmarks.
 *
 * Individual rates are intentionally lower — personal automation scope is narrower.
 */
export const SERVICE_MARKET_RATES_CENTS: Record<string, number> = {
  "tailored-intelligence-server": 4500000, // ~$45,000 avg enterprise build
  "intelligence-audit": 360000, // ~$3,600 business audit
  "personal-intelligence-setup": 35000, // ~$350 personal setup
  "ai-research-assistant": 22000, // ~$220
  "personal-knowledge-base": 28000, // ~$280
  "executive-briefing-intelligence": 58800, // ~$588 annual equivalent ($49/mo)
  "enterprise-ai-strategy": 1580000, // ~$15,800
  "workflow-integration": 880000, // ~$8,800
  "ai-governance-compliance": 1250000, // ~$12,500
  "team-intelligence-training": 480000, // ~$4,800
};

/** Lower market references for personal-scope engagements on dual-audience services. */
export const SERVICE_INDIVIDUAL_MARKET_RATES_CENTS: Partial<Record<string, number>> = {
  "tailored-intelligence-server": 180000, // ~$1,800 personal build
  "intelligence-audit": 52000, // ~$520 personal audit
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
  "Under $500": 50000,
  "Under $1,000": 100000,
  "$1,000 – $5,000": 500000,
  "$5,000 – $15,000": 1500000,
  "$15,000 – $50,000": 5000000,
  "$50,000 – $100,000": 10000000,
  "$100,000+": null,
  "Prefer to discuss": null,
};

export function resolveMarketRateCents(
  serviceSlug: string,
  isIndividual: boolean
): number {
  if (isIndividual && SERVICE_INDIVIDUAL_MARKET_RATES_CENTS[serviceSlug] != null) {
    return SERVICE_INDIVIDUAL_MARKET_RATES_CENTS[serviceSlug]!;
  }
  return SERVICE_MARKET_RATES_CENTS[serviceSlug] ?? 500000;
}
