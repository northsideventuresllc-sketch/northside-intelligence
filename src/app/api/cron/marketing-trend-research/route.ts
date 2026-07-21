import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { runTrendResearch } from "@/lib/marketing-skeleton/trend-research";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** MKT-TREND — Tue + Fri internet trend research feeding skeleton trend_notes + Learnings. */
export async function GET(req: NextRequest) {
  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTrendResearch();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/marketing-trend-research]", err);
    const message = err instanceof Error ? err.message : "research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
