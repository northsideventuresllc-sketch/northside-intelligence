import { NextResponse } from "next/server";
import { ensureStoreEnv } from "@/lib/store/env";
import { getPopularCarouselPicks } from "@/lib/store/popular/picks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureStoreEnv();
    const result = await getPopularCarouselPicks();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[store/popular]", err);
    return NextResponse.json({ error: "Unable to load popular items." }, { status: 500 });
  }
}
