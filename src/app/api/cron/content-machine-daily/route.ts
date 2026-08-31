import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { generateBatchSlot, generateDailyBatch } from "@/lib/content-machine/generator";
import { CONTENT_POST_TYPES, DEFAULT_BRAND_SLUG } from "@/lib/content-machine/constants";
import type { ContentPostType } from "@/lib/content-machine/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * CM7 D8 — daily 7 AM batch generation for Match Fit.
 *
 * CM7-D8-CHUNK (2026-08-31): pass ?postType=Carousel|Static|Video|Text to generate
 * just that one slot in this invocation instead of the whole day. See
 * generateBatchSlot() in generator.ts for why -- the old whole-day-in-one-call path
 * was hitting Vercel's FUNCTION_INVOCATION_TIMEOUT (axon_cron_jobs
 * hermes-content-daily-batch, 504, last run 2026-08-30). The Hermes trigger script
 * (nv-vault .github/scripts/hermes-content-daily-batch.mjs) now calls this once per
 * post type instead of once for the whole day. The unparameterized GET below is
 * left in place, unchanged, for any other existing caller of the full-day path
 * (e.g. a manual admin "regenerate whole day" action) -- only the automated cron
 * path was changed.
 */
export async function GET(req: NextRequest) {
  if (!(await isCronAuthorizedAsync(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const withImages = req.nextUrl.searchParams.get("images") === "1";
  const postTypeParam = req.nextUrl.searchParams.get("postType");
  const batchIdParam = req.nextUrl.searchParams.get("batchId") ?? undefined;
  const dayIndexParam = req.nextUrl.searchParams.get("dayIndex");
  const dayIndex = dayIndexParam !== null ? Number(dayIndexParam) : undefined;

  try {
    if (postTypeParam) {
      if (!CONTENT_POST_TYPES.includes(postTypeParam as ContentPostType)) {
        return NextResponse.json(
          { error: `Unknown postType: ${postTypeParam}` },
          { status: 400 }
        );
      }

      const result = await generateBatchSlot({
        brandSlug: DEFAULT_BRAND_SLUG,
        dayIndex,
        postType: postTypeParam as ContentPostType,
        withImages,
        batchId: batchIdParam,
      });

      return NextResponse.json({
        ok: true,
        batchId: result.batchId,
        postType: postTypeParam,
        skipped: result.skipped,
        status: result.skipped ? "already_generated" : "pending_approval",
      });
    }

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
