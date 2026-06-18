import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { formatCents, getNegotiationPrice } from "@/lib/services/pricing-engine";

const NEGOTIATION_MODEL = "anthropic/claude-haiku-4.5";

interface NegotiationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface NegotiateBody {
  quoteId: string;
  message: string;
  action?: "continue" | "accept";
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
    const nextLevel = Math.min(negotiationLevel + 1, 3);
    const offeredPrice = getNegotiationPrice(
      {
        topPriceCents: quote.top_price_cents,
        floorPriceCents: quote.floor_price_cents,
        negotiationLevels: [],
      },
      nextLevel
    );

    const computedPrice =
      nextLevel === 3
        ? quote.floor_price_cents
        : Math.round((quote.top_price_cents * [1, 0.88, 0.78, 0.58][nextLevel]) / 100) * 100;

    negotiationLevel = nextLevel;

    await admin
      .from("ni_service_quotes")
      .update({
        negotiation_level: nextLevel,
        current_price_cents: computedPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.quoteId);

    const isFinal = nextLevel >= 3;
    const assistantMessage = isFinal
      ? `This is our absolute lowest offer: ${formatCents(computedPrice)}. If this still doesn't work for your budget, please contact our support team for a custom override code. We'd love to find a way to help you.`
      : `Based on your situation, I can offer ${formatCents(computedPrice)} — a meaningful reduction from your initial quote. You can accept this price or continue negotiating for our final offer.`;

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
          offered_price_cents: computedPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("ni_service_negotiations").insert({
        quote_id: body.quoteId,
        user_id: user.id,
        messages: updatedMessages,
        negotiation_level: nextLevel,
        offered_price_cents: computedPrice,
        status: "open",
      });
    }

    return NextResponse.json({
      assistantMessage,
      negotiationLevel: nextLevel,
      offeredPriceCents: computedPrice,
      formattedPrice: formatCents(computedPrice),
      isFinalOffer: isFinal,
      canContinue: !isFinal,
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

  const nextLevel = Math.min(negotiationLevel + 1, 2);
  const offeredPrice =
    nextLevel === 1
      ? Math.round((quote.top_price_cents * 0.88) / 100) * 100
      : Math.round((quote.top_price_cents * 0.78) / 100) * 100;

  const systemPrompt = `You are a compassionate pricing specialist at Northside Intelligence. A client is negotiating the price of "${quote.service_slug}" service.

Current initial quote: ${formatCents(quote.top_price_cents)}
Your negotiated offer: ${formatCents(offeredPrice)}
Floor price (never mention unless asked): ${formatCents(quote.floor_price_cents)}

Respond in 2-3 sentences. Acknowledge their situation with genuine empathy. Explain that you understand budget constraints happen and that Northside wants to make intelligence accessible. Present the negotiated price of ${formatCents(offeredPrice)} as a thoughtful adjustment — not the final lowest price yet. Be warm, professional, and human. Do not use bullet points.`;

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
    assistantText = `Thank you for sharing that with us — we genuinely understand that budget matters. Given your situation, we'd like to offer ${formatCents(offeredPrice)}, which reflects a meaningful adjustment from your initial quote. You can accept this offer or continue the conversation if you'd like to explore further options.`;
  }

  const assistantMessage: NegotiationMessage = {
    role: "assistant",
    content: assistantText,
    timestamp: new Date().toISOString(),
  };
  messages.push(assistantMessage);

  negotiationLevel = nextLevel;

  await admin
    .from("ni_service_quotes")
    .update({
      negotiation_level: nextLevel,
      current_price_cents: offeredPrice,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.quoteId);

  if (existing) {
    await admin
      .from("ni_service_negotiations")
      .update({
        messages,
        negotiation_level: nextLevel,
        offered_price_cents: offeredPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("ni_service_negotiations").insert({
      quote_id: body.quoteId,
      user_id: user.id,
      messages,
      negotiation_level: nextLevel,
      offered_price_cents: offeredPrice,
      status: "open",
    });
  }

  return NextResponse.json({
    assistantMessage: assistantText,
    negotiationLevel: nextLevel,
    offeredPriceCents: offeredPrice,
    formattedPrice: formatCents(offeredPrice),
    isFinalOffer: false,
    canContinue: true,
    messages,
  });
}
