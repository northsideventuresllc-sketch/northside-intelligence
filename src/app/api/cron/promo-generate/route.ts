import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/infra/cron-auth";
import { generateWeeklyPromos, notifyExpiringPromos } from "@/lib/promos/generate";
import { isAutoPromoEnabled } from "@/lib/promos/types";
import { recalculateAllUserSegments } from "@/lib/promos/segments";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const segments = await recalculateAllUserSegments();
    if (!isAutoPromoEnabled()) {
      // Auto promos disabled (Workstream 7): segments stay warm, but no new
      // automatic promos are issued and no expiring-promo nudges go out.
      return NextResponse.json({
        ok: true,
        disabled: true,
        reason: "AUTO_PROMOS_ENABLED is not true",
        segments,
        promos: { generated: 0, skipped: 0 },
        expiringNotified: 0,
      });
    }
    const promos = await generateWeeklyPromos();
    const expiringNotified = await notifyExpiringPromos();
    return NextResponse.json({ ok: true, segments, promos, expiringNotified });
  } catch (err) {
    console.error("[cron/promo-generate]", err);
    return NextResponse.json({ error: "Promo generation failed" }, { status: 500 });
  }
}
