import { NextRequest, NextResponse } from "next/server";
import { STORE_ITEM_CATEGORIES } from "@/lib/store/categories";
import { ensureStoreEnv } from "@/lib/store/env";
import { searchStoreProducts } from "@/lib/store/search/aggregate";

export const dynamic = "force-dynamic";

function parsePositiveInt(raw: string | null, fallback: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

export async function GET(req: NextRequest) {
  try {
    await ensureStoreEnv();

    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q") ?? "";
    const surprise = searchParams.get("surprise") === "1";
    const category = searchParams.get("category")?.trim() || undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = parsePositiveInt(searchParams.get("page"), 1, 100);
    const limit = parsePositiveInt(searchParams.get("limit"), 24, 48);

    const minRetailCents =
      minPrice != null && minPrice !== "" ? Math.round(Number(minPrice) * 100) : undefined;
    const maxRetailCents =
      maxPrice != null && maxPrice !== "" ? Math.round(Number(maxPrice) * 100) : undefined;

    const result = await searchStoreProducts({
      query,
      platforms: ["cj"],
      category,
      minRetailCents:
        minRetailCents != null && Number.isFinite(minRetailCents) ? minRetailCents : undefined,
      maxRetailCents:
        maxRetailCents != null && Number.isFinite(maxRetailCents) ? maxRetailCents : undefined,
      page,
      limit,
      surprise,
    });

    return NextResponse.json({
      ...result,
      categories: STORE_ITEM_CATEGORIES.map((c) => c.id),
    });
  } catch (err) {
    console.error("[store/search]", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
