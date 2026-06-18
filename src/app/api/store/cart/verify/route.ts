import { NextRequest, NextResponse } from "next/server";
import { STORE_ITEM_CATEGORIES } from "@/lib/store/categories";
import { refreshCatalogBySlug } from "@/lib/store/catalog/live-cj";
import { toCatalogProductView } from "@/lib/store/catalog/products";
import { ensureStoreEnv } from "@/lib/store/env";

interface VerifyItemBody {
  slug?: string;
  retailPriceCents?: number;
}

/** Live CJ price/name refresh for saved cart lines. */
export async function POST(req: NextRequest) {
  try {
    await ensureStoreEnv();

    let body: { items?: VerifyItemBody[] };
    try {
      body = (await req.json()) as { items?: VerifyItemBody[] };
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const items = body.items ?? [];
    const synced: Array<ReturnType<typeof toCatalogProductView> & { quantity?: number }> = [];
    const priceChangeNotices = [];
    const unavailable: string[] = [];

    for (const item of items) {
      const slug = item.slug?.trim();
      if (!slug) continue;

      const refreshed = await refreshCatalogBySlug(slug, item.retailPriceCents);
      if (refreshed.unavailable || !refreshed.row) {
        unavailable.push(slug);
        continue;
      }
      if (refreshed.notice) priceChangeNotices.push(refreshed.notice);
      synced.push(toCatalogProductView(refreshed.row));
    }

    return NextResponse.json({
      items: synced,
      priceChangeNotices,
      unavailable,
      categories: STORE_ITEM_CATEGORIES.map((c) => c.id),
    });
  } catch (err) {
    console.error("[store/cart/verify]", err);
    return NextResponse.json({ error: "Cart verification failed." }, { status: 500 });
  }
}
