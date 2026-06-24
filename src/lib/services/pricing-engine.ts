import type { AccountType } from "@/lib/services/offerings";
import { getServiceBySlug } from "@/lib/services/offerings";
import {
  BNPL_MAX_CENTS,
  BNPL_MIN_CENTS,
  BUDGET_CEILING_CENTS,
  BUSINESS_PRICE_MULTIPLIER,
  COMPETITIVE_DISCOUNT,
  FLOOR_RATIO,
  INDIVIDUAL_PRICE_MULTIPLIER,
  NEGOTIATION_TIERS,
  resolveMarketRateCents,
  TEAM_SIZE_MULTIPLIERS,
  TIMELINE_MULTIPLIERS,
  maxPaymentPlanMonths,
} from "@/lib/services/market-rates";

export interface QuoteInput {
  serviceSlug: string;
  accountType: AccountType;
  industry: string;
  currentSystems: string;
  painPoints: string;
  desiredOutcomes: string;
  timeline: string;
  budgetRange: string;
  customBudgetCents?: number | null;
  teamSize: string;
  additionalContext?: string;
}

export interface QuoteLineItem {
  label: string;
  amountCents: number;
  description: string;
}

export interface PaymentPlanOption {
  months: number;
  monthlyCents: number;
  totalCents: number;
  label: string;
}

export interface ServiceQuoteResult {
  serviceSlug: string;
  serviceName: string;
  marketReferenceCents: number;
  topPriceCents: number;
  floorPriceCents: number;
  negotiationLevels: { level: number; label: string; priceCents: number }[];
  currentLevel: number;
  lineItems: QuoteLineItem[];
  reasoning: string[];
  isIndividualPricing: boolean;
  bnplEligible: boolean;
  paymentPlans: PaymentPlanOption[];
  maxPlanMonths: number;
  expiresAt: string;
}

function roundToNearestDollar(cents: number): number {
  return Math.round(cents / 100) * 100;
}

function complexityMultiplier(input: QuoteInput): number {
  const text = [
    input.currentSystems,
    input.painPoints,
    input.desiredOutcomes,
    input.additionalContext ?? "",
  ].join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 40) return 0.92;
  if (words < 100) return 1.0;
  if (words < 200) return 1.1;
  if (words < 350) return 1.22;
  return 1.35;
}

function audienceMultiplier(
  accountType: AccountType,
  serviceAudience: "individual" | "business" | "both"
): { multiplier: number; isIndividual: boolean } {
  const isPersonal = accountType === "personal";
  if (serviceAudience === "individual") {
    return { multiplier: INDIVIDUAL_PRICE_MULTIPLIER, isIndividual: true };
  }
  if (serviceAudience === "business") {
    return { multiplier: BUSINESS_PRICE_MULTIPLIER, isIndividual: false };
  }
  // "both" — discount for personal accounts
  if (isPersonal) {
    return { multiplier: INDIVIDUAL_PRICE_MULTIPLIER, isIndividual: true };
  }
  return { multiplier: BUSINESS_PRICE_MULTIPLIER, isIndividual: false };
}

function budgetCapCents(input: QuoteInput): number | null {
  if (input.customBudgetCents && input.customBudgetCents > 0) {
    return input.customBudgetCents;
  }
  return BUDGET_CEILING_CENTS[input.budgetRange] ?? null;
}

export function generateServiceQuote(input: QuoteInput): ServiceQuoteResult {
  const service = getServiceBySlug(input.serviceSlug);
  if (!service) {
    throw new Error("Unknown service");
  }

  const teamMult = TEAM_SIZE_MULTIPLIERS[input.teamSize] ?? 1.0;
  const timelineMult = TIMELINE_MULTIPLIERS[input.timeline] ?? 1.0;
  const complexityMult = complexityMultiplier(input);
  const { multiplier: audienceMult, isIndividual } = audienceMultiplier(
    input.accountType,
    service.audience
  );

  const marketReferenceCents = resolveMarketRateCents(input.serviceSlug, isIndividual);

  const scopeMultiplier = teamMult * timelineMult * complexityMult;

  let rawTopCents = marketReferenceCents * scopeMultiplier * audienceMult;
  rawTopCents = rawTopCents * (1 - COMPETITIVE_DISCOUNT);

  const cap = budgetCapCents(input);
  if (cap !== null && rawTopCents > cap) {
    rawTopCents = cap;
  }

  const topPriceCents = roundToNearestDollar(Math.max(rawTopCents, 9900));
  const floorPriceCents = roundToNearestDollar(topPriceCents * FLOOR_RATIO);

  const negotiationLevels = NEGOTIATION_TIERS.map((tier) => ({
    level: tier.level,
    label: tier.label,
    priceCents: roundToNearestDollar(
      tier.level === 3 ? floorPriceCents : topPriceCents * tier.multiplier
    ),
  }));

  const lineItems: QuoteLineItem[] = [
    {
      label: "Base Service",
      amountCents: roundToNearestDollar(marketReferenceCents * audienceMult),
      description: `${service.name} — ${isIndividual ? "individual" : "business"} scope`,
    },
  ];

  if (teamMult !== 1.0) {
    const delta = roundToNearestDollar(
      marketReferenceCents * audienceMult * (teamMult - 1)
    );
    lineItems.push({
      label: "Team Scale",
      amountCents: delta,
      description: `Adjusted for ${input.teamSize}`,
    });
  }

  if (timelineMult !== 1.0) {
    const delta = roundToNearestDollar(
      marketReferenceCents * audienceMult * teamMult * (timelineMult - 1)
    );
    lineItems.push({
      label: input.timeline === "As soon as possible" ? "Rush Timeline" : "Timeline Adjustment",
      amountCents: delta,
      description: input.timeline,
    });
  }

  if (complexityMult !== 1.0) {
    const delta = roundToNearestDollar(
      marketReferenceCents * audienceMult * teamMult * timelineMult * (complexityMult - 1)
    );
    lineItems.push({
      label: "Scope Complexity",
      amountCents: delta,
      description: "Based on detail provided in your requirements",
    });
  }

  const competitiveDiscount = roundToNearestDollar(
    marketReferenceCents * scopeMultiplier * audienceMult * COMPETITIVE_DISCOUNT
  );
  lineItems.push({
    label: "NI Competitive Rate",
    amountCents: -competitiveDiscount,
    description: "1.5% below comparable market rates",
  });

  const reasoning: string[] = [
    `Market reference for ${service.name} is ${formatCents(marketReferenceCents)}.`,
  ];

  if (isIndividual) {
    reasoning.push(
      "Individual pricing applied — personal-scope engagements are priced lower than enterprise equivalents."
    );
  }

  reasoning.push(
    `Team size (${input.teamSize}) and timeline (${input.timeline}) adjusted scope.`,
    `Requirements complexity factor: ${(complexityMult * 100).toFixed(0)}% of baseline.`,
    `Your quote of ${formatCents(topPriceCents)} is ~1.5% below market — our most competitive starting point.`,
    `Flexible range: ${formatCents(floorPriceCents)} – ${formatCents(topPriceCents)}. Negotiation may reduce your price further.`
  );

  if (cap !== null) {
    reasoning.push(`Capped to your stated budget of ${formatCents(cap)}.`);
  }

  const maxMonths = maxPaymentPlanMonths(topPriceCents);
  const planMonthOptions = [3, 6, 12, 18, 24].filter((m) => m <= maxMonths && m > 1);
  const paymentPlans: PaymentPlanOption[] = [
    {
      months: 1,
      monthlyCents: topPriceCents,
      totalCents: topPriceCents,
      label: "Pay In Full",
    },
    ...planMonthOptions.map((months) => ({
      months,
      monthlyCents: roundToNearestDollar(topPriceCents / months),
      totalCents: topPriceCents,
      label: `${months} Monthly Payments`,
    })),
  ];

  const bnplEligible =
    topPriceCents >= BNPL_MIN_CENTS && topPriceCents <= BNPL_MAX_CENTS;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    serviceSlug: input.serviceSlug,
    serviceName: service.name,
    marketReferenceCents,
    topPriceCents,
    floorPriceCents,
    negotiationLevels,
    currentLevel: 0,
    lineItems,
    reasoning,
    isIndividualPricing: isIndividual,
    bnplEligible,
    paymentPlans,
    maxPlanMonths: maxMonths,
    expiresAt,
  };
}

export function getNegotiationPrice(
  quote: Pick<ServiceQuoteResult, "topPriceCents" | "floorPriceCents" | "negotiationLevels">,
  level: number
): number {
  const tier = quote.negotiationLevels.find((t) => t.level === level);
  if (tier) return tier.priceCents;
  if (level >= 3) return quote.floorPriceCents;
  return quote.topPriceCents;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatCentsMonthly(cents: number): string {
  return `${formatCents(cents)}/mo`;
}

/** Factors used when approving or denying a lower-price request. */
export interface PriceReductionDecision {
  approved: boolean;
  offeredPriceCents: number;
  factors: string[];
  summary: string;
  canContinue: boolean;
  isFinalOffer: boolean;
}

export interface PriceReductionContext {
  topPriceCents: number;
  floorPriceCents: number;
  currentPriceCents: number;
  negotiationLevel: number;
  accountType: AccountType;
  teamSize: string;
  timeline: string;
  industry: string;
  budgetRange: string;
  requestedPriceCents?: number | null;
}

const HIGH_VALUE_INDUSTRIES = [
  "finance",
  "healthcare",
  "legal",
  "enterprise",
  "government",
  "insurance",
  "banking",
];

/**
 * Evaluates a lower-price request using profitability, client worth, demand,
 * and budget alignment — the same factors NI uses for pricing decisions.
 */
export function evaluatePriceReduction(
  ctx: PriceReductionContext
): PriceReductionDecision {
  const factors: string[] = [];
  let profitabilityScore = 50;
  let clientWorthScore = 50;
  let demandScore = 50;
  let budgetFitScore = 50;

  const isBusiness = ctx.accountType === "business";
  const teamMult = TEAM_SIZE_MULTIPLIERS[ctx.teamSize] ?? 1.0;
  const industryLower = ctx.industry.toLowerCase();

  // Client worth — larger teams and business accounts signal higher lifetime value.
  if (isBusiness) {
    clientWorthScore += 15;
    factors.push("Business account — enterprise scope supports standard pricing.");
  } else {
    clientWorthScore -= 5;
    factors.push("Individual account — personal-scope pricing already applied.");
  }

  if (teamMult >= 1.52) {
    clientWorthScore += 20;
    factors.push("Large team footprint increases engagement value.");
  } else if (teamMult >= 1.28) {
    clientWorthScore += 10;
  } else if (teamMult <= 1.0) {
    clientWorthScore -= 5;
  }

  if (HIGH_VALUE_INDUSTRIES.some((term) => industryLower.includes(term))) {
    clientWorthScore += 12;
    factors.push("High-value sector — pricing reflects specialized delivery requirements.");
  }

  // Demand — rush timelines reduce discount headroom.
  if (ctx.timeline === "As soon as possible") {
    demandScore -= 25;
    factors.push("Urgent timeline increases resource demand — limited discount room.");
  } else if (ctx.timeline === "Within 1–3 months") {
    demandScore -= 10;
  } else if (
    ctx.timeline === "6+ months — exploring options" ||
    ctx.timeline === "Flexible / not sure yet"
  ) {
    demandScore += 15;
    factors.push("Flexible timeline allows better scheduling — more pricing flexibility.");
  }

  // Profitability — margin between current and floor.
  const marginRange = ctx.topPriceCents - ctx.floorPriceCents;
  const currentMargin = ctx.currentPriceCents - ctx.floorPriceCents;
  const marginRatio = marginRange > 0 ? currentMargin / marginRange : 0;

  if (marginRatio <= 0.15) {
    profitabilityScore -= 30;
    factors.push("Quote is near minimum profitable margin — further reduction is limited.");
  } else if (marginRatio <= 0.35) {
    profitabilityScore -= 15;
  } else {
    profitabilityScore += 10;
  }

  // Budget alignment — requested price vs. stated budget range.
  const budgetCeiling = BUDGET_CEILING_CENTS[ctx.budgetRange];
  if (ctx.requestedPriceCents && ctx.requestedPriceCents > 0) {
    if (ctx.requestedPriceCents >= ctx.floorPriceCents) {
      budgetFitScore += 15;
      factors.push(
        `Requested price of ${formatCents(ctx.requestedPriceCents)} is within our serviceable range.`
      );
    } else {
      budgetFitScore -= 30;
      factors.push(
        `Requested price of ${formatCents(ctx.requestedPriceCents)} is below our minimum profitable floor.`
      );
    }

    if (budgetCeiling && ctx.requestedPriceCents <= budgetCeiling) {
      budgetFitScore += 10;
      factors.push("Requested price aligns with your stated budget range.");
    }
  } else if (budgetCeiling) {
    budgetFitScore += 5;
  }

  const compositeScore =
    profitabilityScore * 0.35 +
    clientWorthScore * 0.25 +
    demandScore * 0.2 +
    budgetFitScore * 0.2;

  const nextLevel = Math.min(ctx.negotiationLevel + 1, 3);
  const tierMultiplier = [1, 0.88, 0.78, FLOOR_RATIO][nextLevel];
  let offeredPrice = roundToNearestDollar(ctx.topPriceCents * tierMultiplier);

  if (nextLevel >= 3) {
    offeredPrice = ctx.floorPriceCents;
  }

  // Adjust offer toward requested price when composite score supports it.
  if (
    ctx.requestedPriceCents &&
    ctx.requestedPriceCents >= ctx.floorPriceCents &&
    ctx.requestedPriceCents < offeredPrice &&
    compositeScore >= 45
  ) {
    offeredPrice = roundToNearestDollar(ctx.requestedPriceCents);
    factors.push("Requested price approved based on combined business factors.");
  }

  const isFinalOffer = nextLevel >= 3;
  const approved =
    offeredPrice < ctx.currentPriceCents &&
    offeredPrice >= ctx.floorPriceCents &&
    compositeScore >= 35;

  if (!approved && ctx.requestedPriceCents && ctx.requestedPriceCents < ctx.floorPriceCents) {
    return {
      approved: false,
      offeredPriceCents: ctx.currentPriceCents,
      factors,
      summary:
        "We cannot approve a price below our minimum profitable floor. Our final offer reflects the lowest sustainable rate for this scope.",
      canContinue: !isFinalOffer && ctx.negotiationLevel < 2,
      isFinalOffer,
    };
  }

  if (!approved) {
    return {
      approved: false,
      offeredPriceCents: ctx.currentPriceCents,
      factors,
      summary:
        "Based on profitability, client value, and current demand, we cannot reduce the price further at this stage. You may continue the conversation or accept the current quote.",
      canContinue: !isFinalOffer && ctx.negotiationLevel < 2,
      isFinalOffer,
    };
  }

  const summary = isFinalOffer
    ? `This is our lowest sustainable offer at ${formatCents(offeredPrice)} — evaluated against profitability, project worth, and demand.`
    : `We can offer ${formatCents(offeredPrice)} based on profitability, client value, demand, and your budget alignment.`;

  return {
    approved: true,
    offeredPriceCents: offeredPrice,
    factors,
    summary,
    canContinue: !isFinalOffer,
    isFinalOffer,
  };
}
