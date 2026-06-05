import { NextRequest, NextResponse } from "next/server";
import { callReplyFlowEdge } from "@/lib/replyflow/replyflow-edge";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const result = await callReplyFlowEdge<{ received?: boolean; error?: string }>(
    "stripe-webhook",
    {},
    { rawBody: body, stripeSignature: sig }
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.error ?? "Webhook failed" },
      { status: result.status }
    );
  }

  return NextResponse.json({ received: true });
}
