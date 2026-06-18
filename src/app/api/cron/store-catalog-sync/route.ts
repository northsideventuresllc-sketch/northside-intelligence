import { NextRequest, NextResponse } from "next/server";
import { refreshCjCatalogListings } from "@/lib/store/catalog/refresh-cj";
import { syncCjCatalogBatch } from "@/lib/store/catalog/sync-cj-catalog";
import { ensureStoreEnv } from "@/lib/store/env";

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
    const sync = await syncCjCatalogBatch();
    const enriched = await refreshCjCatalogListings(40);
    return NextResponse.json({ ok: true, sync, enriched });
  } catch (err) {
    console.error("[cron/store-catalog-sync]", err);
    return NextResponse.json({ error: "Catalog sync failed" }, { status: 500 });
  }
}
