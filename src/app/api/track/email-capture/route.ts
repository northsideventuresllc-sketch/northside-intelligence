import { NextRequest, NextResponse } from "next/server";
import {
  normalizeEmailCapture,
  recordEmailCapture,
} from "@/lib/tracking/email-capture";

export const dynamic = "force-dynamic";

/**
 * Public choke point for client-side email capture (WS10).
 *
 * Any form can POST { email, sourceTool, sourcePage? } here; the server
 * validates, dedupes by email hash, and writes one 72h row to
 * `email_captures`. The API routes that own the main forms also call
 * recordEmailCapture() directly, so coverage holds even if this call fails.
 *
 * This endpoint is intentionally unauthenticated (visitors aren't logged
 * in). Abuse is bounded: strict email validation + hash dedupe means junk
 * input is rejected and repeats just refresh a single row's 72h window.
 */
export async function POST(req: NextRequest) {
  let body: { email?: unknown; sourceTool?: unknown; sourcePage?: unknown } =
    {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!normalizeEmailCapture(body.email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }
  if (typeof body.sourceTool !== "string" || !body.sourceTool.trim()) {
    return NextResponse.json(
      { error: "sourceTool required." },
      { status: 400 }
    );
  }

  const { ok } = await recordEmailCapture({
    email: body.email as string,
    sourceTool: body.sourceTool,
    sourcePage:
      typeof body.sourcePage === "string" ? body.sourcePage : undefined,
  });

  return NextResponse.json({ ok });
}
