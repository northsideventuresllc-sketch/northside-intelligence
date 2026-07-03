import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/infra/cron-auth";
import { generateWeeklyPromos, notifyExpiringPromos } from "@/lib/promos/generate";
import { recalculateAllUserSegments } from "@/lib/promos/segments";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const segments = await recalculateAllUserSegments();
    const promos = await generateWeeklyPromos();
    const expiringNotified = await notifyExpiringPromos();
    return NextResponse.json({ ok: true, segments, promos, expiringNotified });
  } catch (err) {
    console.error("[cron/promo-generate]", err);
    return NextResponse.json({ error: "Promo generation failed" }, { status: 500 });
  }
}
