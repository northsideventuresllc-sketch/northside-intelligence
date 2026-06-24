import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getServiceBySlug, type AccountType } from "@/lib/services/offerings";
import { generateServiceQuote } from "@/lib/services/pricing-engine";

interface QuoteRequestBody {
  serviceSlug: string;
  accountType: AccountType;
  industry: string;
  currentSystems: string;
  painPoints: string;
  desiredOutcomes: string;
  timeline: string;
  budgetRange: string;
  customBudget?: string;
  requestedLowerPrice?: string;
  teamSize: string;
  additionalContext?: string;
  contactName?: string;
  email?: string;
  businessName?: string;
}

const VALID_ACCOUNT_TYPES: AccountType[] = ["personal", "business"];

function parseCustomBudgetCents(value?: string): number | null {
  if (!value?.trim()) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  const dollars = parseFloat(cleaned);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "An account is required to get a quote" }, { status: 401 });
  }

  let body: QuoteRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.serviceSlug?.trim()) {
    return NextResponse.json({ error: "Service slug is required" }, { status: 400 });
  }

  const service = getServiceBySlug(body.serviceSlug.trim());
  if (!service) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  if (!VALID_ACCOUNT_TYPES.includes(body.accountType)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  const required = [
    "industry",
    "currentSystems",
    "painPoints",
    "desiredOutcomes",
    "timeline",
    "budgetRange",
    "teamSize",
  ] as const;

  for (const field of required) {
    if (!body[field]?.trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const quote = generateServiceQuote({
    serviceSlug: body.serviceSlug.trim(),
    accountType: body.accountType,
    industry: body.industry.trim(),
    currentSystems: body.currentSystems.trim(),
    painPoints: body.painPoints.trim(),
    desiredOutcomes: body.desiredOutcomes.trim(),
    timeline: body.timeline.trim(),
    budgetRange: body.budgetRange.trim(),
    customBudgetCents: parseCustomBudgetCents(body.customBudget),
    teamSize: body.teamSize.trim(),
    additionalContext: body.additionalContext?.trim(),
  });

  const admin = createServiceClient();
  const now = new Date().toISOString();

  const intakePayload = {
    contactName: body.contactName?.trim() ?? "",
    email: body.email?.trim() ?? "",
    businessName: body.businessName?.trim() ?? null,
    industry: body.industry.trim(),
    currentSystems: body.currentSystems.trim(),
    painPoints: body.painPoints.trim(),
    desiredOutcomes: body.desiredOutcomes.trim(),
    timeline: body.timeline.trim(),
    budgetRange: body.budgetRange.trim(),
    customBudget: body.customBudget?.trim() ?? null,
    requestedLowerPrice: body.requestedLowerPrice?.trim() ?? null,
    teamSize: body.teamSize.trim(),
    additionalContext: body.additionalContext?.trim() ?? "",
  };

  const { data: inserted, error: insertError } = await admin
    .from("ni_service_quotes")
    .insert({
      user_id: user.id,
      service_slug: body.serviceSlug.trim(),
      account_type: body.accountType,
      intake_payload: intakePayload,
      market_reference_cents: quote.marketReferenceCents,
      top_price_cents: quote.topPriceCents,
      floor_price_cents: quote.floorPriceCents,
      current_price_cents: quote.topPriceCents,
      negotiation_level: 0,
      line_items: quote.lineItems,
      reasoning: quote.reasoning,
      payment_plans: quote.paymentPlans,
      bnpl_eligible: quote.bnplEligible,
      status: "active",
      expires_at: quote.expiresAt,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Failed to insert quote:", insertError);
    return NextResponse.json({ error: "Failed to generate quote" }, { status: 500 });
  }

  return NextResponse.json({
    quoteId: inserted.id,
    ...quote,
  });
}
