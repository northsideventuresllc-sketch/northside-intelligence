import { NextRequest, NextResponse } from "next/server";
import { STORE_ITEM_CATEGORIES } from "@/lib/store/categories";
import { resolveCatalogLineRetailCents } from "@/lib/store/catalog/line-price";
import { refreshCatalogFromCj } from "@/lib/store/catalog/live-cj";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import { ensureStoreEnv } from "@/lib/store/env";

interface VerifyItemBody {
  slug?: string;
  retailPriceCents?: number;
  variantId?: string | null;
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
    const synced: Array<{
      slug: string;
      name: string;
      imageUrl: string | null;
      retailPriceCents: number;
      currency: string;
      sourcePlatform: string;
      variantId: string | null;
    }> = [];
    const priceChangeNotices = [];
    const unavailable: string[] = [];

    for (const item of items) {
      const slug = item.slug?.trim();
      if (!slug) continue;

      const row = await getCatalogProductBySlug(slug);
      if (!row) {
        unavailable.push(slug);
        continue;
      }

      const refreshed = await refreshCatalogFromCj(row);
      if (refreshed.unavailable || !refreshed.row) {
        unavailable.push(slug);
        continue;
      }

      const variantId = item.variantId?.trim() || null;
      const currentRetailCents = resolveCatalogLineRetailCents(refreshed.row, variantId);
      const clientRetailCents = item.retailPriceCents;

      if (
        clientRetailCents != null &&
        Number.isFinite(clientRetailCents) &&
        clientRetailCents !== currentRetailCents
      ) {
        priceChangeNotices.push({
          slug: refreshed.row.slug,
          name: refreshed.row.name,
          previousRetailCents: clientRetailCents,
          currentRetailCents,
          reason:
            "CJ supplier pricing changed since your last view. NI retail is always supplier listing price + 10%.",
        });
      }

      synced.push({
        slug: refreshed.row.slug,
        name: refreshed.row.name,
        imageUrl: refreshed.row.imageUrl,
        retailPriceCents: currentRetailCents,
        currency: refreshed.row.currency,
        sourcePlatform: refreshed.row.sourcePlatform,
        variantId,
      });
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
