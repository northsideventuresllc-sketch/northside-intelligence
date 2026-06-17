import { NextRequest, NextResponse } from "next/server";
import { listCatalogCategories } from "@/lib/store/sources/curated-search";
import { ensureStoreEnv } from "@/lib/store/env";
import { searchStoreProducts } from "@/lib/store/search/aggregate";
import type { DropshipPlatform } from "@/lib/store/sources/types";
import { DROPSHIP_SOURCE_PLATFORMS } from "@/lib/store/platform-labels";

export const dynamic = "force-dynamic";

const VALID_PLATFORMS = new Set<string>([
  ...DROPSHIP_SOURCE_PLATFORMS.map((p) => p.id),
  "curated",
]);

function parsePlatforms(raw: string | null): DropshipPlatform[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is DropshipPlatform => VALID_PLATFORMS.has(p));
}

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
    const platforms = parsePlatforms(searchParams.get("platforms"));
    const category = searchParams.get("category")?.trim() || undefined;
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const page = parsePositiveInt(searchParams.get("page"), 1, 100);
    const limit = parsePositiveInt(searchParams.get("limit"), 24, 48);

    const minRetailCents =
      minPrice != null && minPrice !== "" ? Math.round(Number(minPrice) * 100) : undefined;
    const maxRetailCents =
      maxPrice != null && maxPrice !== "" ? Math.round(Number(maxPrice) * 100) : undefined;

    const [result, categories] = await Promise.all([
      searchStoreProducts({
        query,
        platforms,
        category,
        minRetailCents:
          minRetailCents != null && Number.isFinite(minRetailCents) ? minRetailCents : undefined,
        maxRetailCents:
          maxRetailCents != null && Number.isFinite(maxRetailCents) ? maxRetailCents : undefined,
        page,
        limit,
      }),
      listCatalogCategories(),
    ]);

    return NextResponse.json({ ...result, categories });
  } catch (err) {
    console.error("[store/search]", err);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
