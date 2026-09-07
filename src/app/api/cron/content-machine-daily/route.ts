import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { isCronAuthorizedAsync } from "@/lib/infra/cron-auth";
import { hydratePlatformEnvFromDatabase } from "@/lib/hydrate-platform-env";
import { readPlatformSecret } from "@/lib/platform-secrets";
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
 * generateBatchSlot() in generator.ts for why -- a whole-day-in-one-call path
 * risks Vercel's FUNCTION_INVOCATION_TIMEOUT.
 *
 * CM7-D8-CHUNK-HOPS (2026-09-07): confirmed live (nv-vault Learning #8364 /
 * MF-CONTENT-GEN-VERCEL-504-0907, and this repo's own equivalent 5-brand run
 * 2026-09-07 16:46-16:51 UTC where bridgeai's request 504'd) that the
 * ?postType= param above was necessary but not sufficient -- whatever calls
 * this route without ?postType= (the Mac-mini AXON/Hermes trigger, per
 * nv-vault Harness Cron Map "content-machine-daily | AXON trigger | Hermes
 * local" -- not a script in any git repo, so it can't be fixed here) still hit
 * the old unparameterized path, which ran generateDailyBatch synchronously for
 * all 4 post types in one Vercel invocation. Same shape as the matchfit
 * content-calendar-weekly-generate fix (MF-CONTENT-GEN-VERCEL-504-0907): fan
 * out one same-origin hop per post type instead, so no single invocation ever
 * has to do more than one slot's worth of AI generation.
 *
 * This repo runs Next.js 14.2 (package.json), which does not export Next's
 * `after()` (stabilized in Next 15) -- matchfit's actual fix uses that API
 * directly, which would silently be `undefined` here. The background-dispatch
 * primitive used instead is `@vercel/functions`'s `waitUntil`, the same
 * underlying Vercel Functions runtime primitive `after()` itself wraps, and it
 * works against any Next version. Each hop below is a REAL new HTTP request
 * back to this same route with ?postType= and ?hop=1 set, so each hop gets a
 * genuinely fresh maxDuration=300 Lambda invocation of its own rather than
 * sharing this one's clock -- waitUntil() only keeps the CALLING invocation
 * alive long enough to finish sending those 4 requests after it has already
 * responded to whoever triggered it (cron or manual); it does not extend that
 * invocation's own compute budget past its own maxDuration, and does not need
 * to, because the real generation work happens inside each hop's own separate
 * invocation. A hop request itself also acks in well under a second and
 * defers its own generateBatchSlot() call into ITS OWN waitUntil() for the
 * same reason -- see the `postTypeParam` branch below.
 *
 * If no CRON_SECRET is resolvable (needed to authorize the same-origin hop
 * calls -- this route's own auth also accepts Vercel's bare `x-vercel-cron`
 * header with no CRON_SECRET set at all), hop dispatch is impossible; this
 * falls back to the original synchronous generateDailyBatch() call rather than
 * silently doing nothing. That fallback still carries the original timeout
 * risk -- it is a safety net, not a fix -- but a real attempt beats none.
 */
function resolveHopSecret(): string | undefined {
  return process.env.CRON_SECRET?.trim() || undefined;
}

function dispatchPostTypeHops(
  req: NextRequest,
  args: { brandSlug: string; dayIndex?: number; withImages: boolean; batchId: string; secret: string }
) {
  const base = new URL(req.url);
  waitUntil(
    (async () => {
      for (const postType of CONTENT_POST_TYPES) {
        const hopUrl = new URL(base.origin + base.pathname);
        hopUrl.searchParams.set("brandSlug", args.brandSlug);
        hopUrl.searchParams.set("postType", postType);
        hopUrl.searchParams.set("batchId", args.batchId);
        hopUrl.searchParams.set("hop", "1");
        if (args.withImages) hopUrl.searchParams.set("images", "1");
        if (args.dayIndex !== undefined) hopUrl.searchParams.set("dayIndex", String(args.dayIndex));
        try {
          await fetch(hopUrl.toString(), {
            headers: { authorization: `Bearer ${args.secret}` },
          });
        } catch (e) {
          console.error(`[cron/content-machine-daily] hop dispatch failed for postType ${postType}`, e);
        }
      }
    })()
  );
}

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
  const isHop = req.nextUrl.searchParams.get("hop") === "1";

  try {
    if (postTypeParam) {
      if (!CONTENT_POST_TYPES.includes(postTypeParam as ContentPostType)) {
        return NextResponse.json(
          { error: `Unknown postType: ${postTypeParam}` },
          { status: 400 }
        );
      }

      if (isHop) {
        // Same-origin hop from dispatchPostTypeHops: ack immediately, do the one
        // bounded slot's generation in the background via this invocation's OWN
        // waitUntil so it runs against this invocation's own fresh maxDuration
        // budget without making the dispatcher (or cron/Vercel) wait for it.
        const batchId = batchIdParam ?? randomUUID();
        waitUntil(
          generateBatchSlot({
            brandSlug,
            dayIndex,
            postType: postTypeParam as ContentPostType,
            withImages,
            batchId,
          })
            .then((result) => {
              console.log("[cron/content-machine-daily] hop complete", brandSlug, postTypeParam, result);
            })
            .catch((err) => {
              console.error("[cron/content-machine-daily] hop failed", brandSlug, postTypeParam, err);
            })
        );
        return NextResponse.json({
          ok: true,
          accepted: true,
          brandSlug,
          postType: postTypeParam,
          batchId,
        });
      }

      // Direct call with ?postType= but no ?hop=1 (e.g. a human or a script asking
      // for exactly one post type and wanting the real result back inline) stays
      // fully synchronous -- one slot is already bounded well under 300s.
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

    // No ?postType= given: this is the "whole day for this brand" path. Fan out one
    // hop per post type (see the big comment above) instead of running the whole
    // batch in this one invocation.
    await hydratePlatformEnvFromDatabase();
    const secret =
      resolveHopSecret() || (await readPlatformSecret("CRON_SECRET"))?.trim() || undefined;
    const batchId = batchIdParam ?? randomUUID();

    if (secret) {
      dispatchPostTypeHops(req, { brandSlug, dayIndex, withImages, batchId, secret });
      return NextResponse.json({
        ok: true,
        dispatched: CONTENT_POST_TYPES,
        brandSlug,
        batchId,
        status: "dispatched",
      });
    }

    console.error(
      "[cron/content-machine-daily] no CRON_SECRET resolvable to authorize same-origin hop calls -- falling back to in-process full batch (original 504 risk applies)"
    );
    const result = await generateDailyBatch({ brandSlug, withImages });
    return NextResponse.json({
      ok: true,
      batchId: result.batchId,
      postCount: result.posts.length,
      status: "pending_approval",
      // BUILD fix 2026-09-07: one post type hard-rejected (e.g. banned phrase) no longer
      // aborts the other post types in this brand's daily batch — see generateDailyBatch.
      failures: result.failures,
      fallback: "in_process_no_secret",
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
