import { NextRequest, NextResponse } from "next/server";
import {
  CJ_PAGES_PER_DAILY_RUN,
  syncCjCatalogBatch,
} from "@/lib/store/catalog/sync-cj-catalog";
import { ensureStoreEnv } from "@/lib/store/env";
import { refreshDailyViralPicks } from "@/lib/store/viral/refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  await ensureStoreEnv();

  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Bulk CJ ingest runs here (daily) — hourly catalog cron is not reliable on Hobby plans.
    const sync = await syncCjCatalogBatch(CJ_PAGES_PER_DAILY_RUN);
    const result = await refreshDailyViralPicks();
    return NextResponse.json({ ok: true, sync, ...result });
  } catch (err) {
    console.error("[cron/store-viral-refresh]", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
