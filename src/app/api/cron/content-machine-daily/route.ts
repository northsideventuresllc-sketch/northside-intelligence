import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { generateBatchSlot, generateDailyBatch } from "@/lib/content-machine/generator";
import { CONTENT_POST_TYPES, DEFAULT_BRAND_SLUG } from "@/lib/content-machine/constants";
import type { ContentPostType } from "@/lib/content-machine/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * CM7 D8 — daily 7 AM batch generation, one brand per run.
 *
 * FIXED 2026-09-01 (JB direct live order, this session): this route silently
 * hardcoded brandSlug to DEFAULT_BRAND_SLUG ("match-fit") on every call, so
 * despite being named/documented as the NI Portal's daily content generator
 * (AXON Telegram CM6 approval queue), it could never produce a single row for
 * any real NI brand (bridgeai, gapscan, grantbot, replyflow, signaldesk,
 * ni-store, ni-webdesign, ni) -- content_machine_posts saw zero new NI rows
 * for 6+ days as a direct result. Match Fit content already has its own
 * dedicated weekly generator in the matchfit repo
 * (match-fit-content-calendar-weekly-generate.yml -> match_fit_content_calendar_posts
 * directly) -- this route hitting match-fit via an unrequested default was
 * never the intended path for MF and duplicated/confused that pipeline.
 * Now accepts ?brandSlug=<slug> from the caller (falls back to
 * DEFAULT_BRAND_SLUG only if the caller genuinely omits it, e.g. a manual
 * admin hit with no param) instead of always overriding whatever was asked
 * for.
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
  const brandSlugParam = req.nextUrl.searchParams.get("brandSlug")?.trim();
  const brandSlug = brandSlugParam || DEFAULT_BRAND_SLUG;

  try {
    if (postTypeParam) {
      if (!CONTENT_POST_TYPES.includes(postTypeParam as ContentPostType)) {
        return NextResponse.json(
          { error: `Unknown postType: ${postTypeParam}` },
          { status: 400 }
        );
      }

      const result = await generateBatchSlot({
        brandSlug,
        dayIndex,
        postType: postTypeParam as ContentPostType,
        withImages,
        batchId: batchIdParam,
      });

      return NextResponse.json({
        ok: true,
        batchId: result.batchId,
        brandSlug,
        postType: postTypeParam,
        skipped: result.skipped,
        status: result.skipped ? "already_generated" : "pending_approval",
      });
    }

    const result = await generateDailyBatch({
      brandSlug,
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
