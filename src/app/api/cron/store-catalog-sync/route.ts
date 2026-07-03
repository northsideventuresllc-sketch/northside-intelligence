import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/infra/cron-auth";
import { refreshCjCatalogListings } from "@/lib/store/catalog/refresh-cj";
import { syncCjCatalogBatch } from "@/lib/store/catalog/sync-cj-catalog";
import { ensureStoreEnv } from "@/lib/store/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  await ensureStoreEnv();

  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sync = await syncCjCatalogBatch();
    const enriched = await refreshCjCatalogListings(20);
    return NextResponse.json({ ok: true, sync, enriched });
  } catch (err) {
    console.error("[cron/store-catalog-sync]", err);
    return NextResponse.json({ error: "Catalog sync failed" }, { status: 500 });
  }
}
