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
    // Health Scan 2026-07-30: this route returned the bare string "Daily batch failed"
    // on 2026-07-28 and 2026-07-29 (nv-vault runs 30361262219, 30453677275), which named
    // nothing — the real cause was a non-Error throw and got swallowed. Anything thrown is
    // now described in the response so the failing cron log identifies its own cause.
    const message =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : `Daily batch failed (non-Error throw: ${
            typeof err === "object" && err !== null
              ? JSON.stringify(err).slice(0, 400)
              : String(err).slice(0, 400)
          })`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
