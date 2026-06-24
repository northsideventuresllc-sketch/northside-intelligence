import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import type { AccountType } from "@/lib/services/offerings";
import {
  evaluatePriceReduction,
  formatCents,
} from "@/lib/services/pricing-engine";

const NEGOTIATION_MODEL = "anthropic/claude-haiku-4.5";

interface NegotiationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface IntakePayload {
  industry?: string;
  teamSize?: string;
  timeline?: string;
  budgetRange?: string;
  requestedLowerPrice?: string | null;
}

interface NegotiateBody {
  quoteId: string;
  message: string;
  action?: "continue" | "accept";
}

function parseRequestedPriceCents(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  const dollars = parseFloat(cleaned);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

function buildReductionContext(
  quote: {
    top_price_cents: number;
    floor_price_cents: number;
    current_price_cents: number;
    negotiation_level: number | null;
    account_type: string;
    intake_payload: IntakePayload | null;
  },
  negotiationLevel: number
) {
  const intake = quote.intake_payload ?? {};
  return {
    topPriceCents: quote.top_price_cents,
    floorPriceCents: quote.floor_price_cents,
    currentPriceCents: quote.current_price_cents,
    negotiationLevel,
    accountType: quote.account_type as AccountType,
    teamSize: intake.teamSize ?? "Just me",
    timeline: intake.timeline ?? "Flexible / not sure yet",
    industry: intake.industry ?? "",
    budgetRange: intake.budgetRange ?? "Prefer to discuss",
    requestedPriceCents: parseRequestedPriceCents(intake.requestedLowerPrice),
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: NegotiateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.quoteId?.trim()) {
    return NextResponse.json({ error: "Quote ID is required" }, { status: 400 });
  }

  const admin = createServiceClient();

  const { data: quote, error: quoteError } = await admin
    .from("ni_service_quotes")
    .select("*")
    .eq("id", body.quoteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status !== "active") {
    return NextResponse.json({ error: "This quote is no longer active" }, { status: 409 });
  }

  const { data: existing } = await admin
    .from("ni_service_negotiations")
    .select("*")
    .eq("quote_id", body.quoteId)
    .eq("user_id", user.id)
    .maybeSingle();

  const messages: NegotiationMessage[] = existing?.messages ?? [];
  let negotiationLevel = existing?.negotiation_level ?? quote.negotiation_level ?? 0;

  if (body.action === "accept") {
    const acceptedPrice = quote.current_price_cents;
    await admin
      .from("ni_service_quotes")
      .update({
        status: "accepted",
        current_price_cents: acceptedPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.quoteId);

    if (existing) {
      await admin
        .from("ni_service_negotiations")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    return NextResponse.json({
      accepted: true,
      priceCents: acceptedPrice,
      formattedPrice: formatCents(acceptedPrice),
    });
  }

  if (body.action === "continue") {
    const decision = evaluatePriceReduction(
      buildReductionContext(quote, negotiationLevel)
    );
    const nextLevel = Math.min(negotiationLevel + 1, 3);
    negotiationLevel = nextLevel;

    const offeredPrice = decision.approved
      ? decision.offeredPriceCents
      : quote.current_price_cents;

    if (decision.approved) {
      await admin
        .from("ni_service_quotes")
        .update({
          negotiation_level: nextLevel,
          current_price_cents: offeredPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.quoteId);
    }

    const factorSummary = decision.factors.slice(0, 2).join(" ");
    const assistantMessage = decision.approved
      ? `${decision.summary} ${factorSummary}`
      : decision.summary;

    const updatedMessages: NegotiationMessage[] = [
      ...messages,
      {
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      },
    ];

    if (existing) {
      await admin
        .from("ni_service_negotiations")
        .update({
          messages: updatedMessages,
          negotiation_level: nextLevel,
          offered_price_cents: offeredPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("ni_service_negotiations").insert({
        quote_id: body.quoteId,
        user_id: user.id,
        messages: updatedMessages,
        negotiation_level: nextLevel,
        offered_price_cents: offeredPrice,
        status: "open",
      });
    }

    return NextResponse.json({
      assistantMessage,
      negotiationLevel: nextLevel,
      offeredPriceCents: decision.approved ? offeredPrice : undefined,
      formattedPrice: decision.approved ? formatCents(offeredPrice) : undefined,
      isFinalOffer: decision.isFinalOffer,
      canContinue: decision.canContinue,
      approved: decision.approved,
      factors: decision.factors,
    });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const userMessage: NegotiationMessage = {
    role: "user",
    content: body.message.trim(),
    timestamp: new Date().toISOString(),
  };
  messages.push(userMessage);

  const decision = evaluatePriceReduction(
    buildReductionContext(quote, negotiationLevel)
  );
  const nextLevel = Math.min(negotiationLevel + 1, 3);
  const offeredPrice = decision.approved ? decision.offeredPriceCents : quote.current_price_cents;

  const factorsBlock = decision.factors.map((f) => `• ${f}`).join("\n");

  const systemPrompt = `You are a pricing specialist at Northside Intelligence. A client is negotiating the price of "${quote.service_slug}" service.

Current quote: ${formatCents(quote.current_price_cents)}
Decision: ${decision.approved ? "APPROVED reduction" : "Cannot approve further reduction at this time"}
${decision.approved ? `New offered price: ${formatCents(offeredPrice)}` : ""}
Floor price (never mention unless asked): ${formatCents(quote.floor_price_cents)}

Business factors evaluated:
${factorsBlock}

Respond in 2-3 sentences. If approved, present ${formatCents(offeredPrice)} warmly and briefly reference that the decision reflects profitability, project worth, and demand. If denied, explain empathetically why we cannot go lower right now, referencing the business factors without listing them as bullets. Be warm and professional.`;

  let assistantText: string;
  try {
    const { text } = await generateText({
      model: NEGOTIATION_MODEL,
      system: systemPrompt,
      prompt: body.message.trim(),
      maxOutputTokens: 300,
    });
    assistantText = text.trim();
  } catch {
    assistantText = decision.approved
      ? `${decision.summary} You can accept this offer or continue negotiating.`
      : decision.summary;
  }

  const assistantMessage: NegotiationMessage = {
    role: "assistant",
    content: assistantText,
    timestamp: new Date().toISOString(),
  };
  messages.push(assistantMessage);

  negotiationLevel = nextLevel;

  if (decision.approved) {
    await admin
      .from("ni_service_quotes")
      .update({
        negotiation_level: nextLevel,
        current_price_cents: offeredPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.quoteId);
  }

  if (existing) {
    await admin
      .from("ni_service_negotiations")
      .update({
        messages,
        negotiation_level: nextLevel,
        offered_price_cents: decision.approved ? offeredPrice : existing.offered_price_cents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("ni_service_negotiations").insert({
      quote_id: body.quoteId,
      user_id: user.id,
      messages,
      negotiation_level: nextLevel,
      offered_price_cents: decision.approved ? offeredPrice : null,
      status: "open",
    });
  }

  return NextResponse.json({
    assistantMessage: assistantText,
    negotiationLevel: nextLevel,
    offeredPriceCents: decision.approved ? offeredPrice : undefined,
    formattedPrice: decision.approved ? formatCents(offeredPrice) : undefined,
    isFinalOffer: decision.isFinalOffer,
    canContinue: decision.canContinue,
    approved: decision.approved,
    factors: decision.factors,
    messages,
  });
}
