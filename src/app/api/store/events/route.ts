import { NextRequest, NextResponse } from "next/server";
import { recordStoreEvent, type StoreEventType } from "@/lib/store/personalization/events";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const ALLOWED_EVENTS: StoreEventType[] = [
  "view",
  "click",
  "search",
  "purchase",
  "carousel_impression",
];

export async function POST(req: NextRequest) {
  let body: {
    eventType?: string;
    catalogId?: string;
    searchQuery?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const eventType = body.eventType as StoreEventType;
  if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await recordStoreEvent(user?.id ?? null, {
      eventType,
      catalogId: body.catalogId,
      searchQuery: body.searchQuery,
      sessionId: body.sessionId,
      metadata: body.metadata,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[store/events]", err);
    return NextResponse.json({ error: "Unable to record event." }, { status: 500 });
  }
}
