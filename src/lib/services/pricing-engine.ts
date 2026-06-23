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
