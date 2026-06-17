import { NextRequest, NextResponse } from "next/server";
import { refreshDailyViralPicks } from "@/lib/store/viral/refresh";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshDailyViralPicks();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/store-viral-refresh]", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
