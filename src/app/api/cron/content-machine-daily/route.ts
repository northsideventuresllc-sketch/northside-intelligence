import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { generateDailyBatch } from "@/lib/content-machine/generator";
import { DEFAULT_BRAND_SLUG } from "@/lib/content-machine/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** CM7 D8 — daily 7 AM batch generation for Match Fit */
export async function GET(req: NextRequest) {
  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const withImages = req.nextUrl.searchParams.get("images") === "1";
    const result = await generateDailyBatch({
      brandSlug: DEFAULT_BRAND_SLUG,
      withImages,
    });

    return NextResponse.json({
      ok: true,
      batchId: result.batchId,
      postCount: result.posts.length,
      status: "pending_approval",
    });
  } catch (err) {
    console.error("[cron/content-machine-daily]", err);
    const message = err instanceof Error ? err.message : "Daily batch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
