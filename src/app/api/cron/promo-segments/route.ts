import { NextRequest, NextResponse } from "next/server";
import { recalculateAllUserSegments } from "@/lib/promos/segments";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await recalculateAllUserSegments();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/promo-segments]", err);
    return NextResponse.json({ error: "Segment recalculation failed" }, { status: 500 });
  }
}
