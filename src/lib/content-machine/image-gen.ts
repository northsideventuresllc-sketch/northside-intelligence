/**
 * Content Machine media queueing (CM4).
 *
 * NI-IMAGE-GEN-DIRECT-GEMINI-API-0906: this file used to call
 * generativelanguage.googleapis.com directly to generate the image itself.
 * That is disabled by policy (NI-Brain Decision #1722 item 4, JB direct,
 * 2026-09-03): social media images/video are generated ONLY in the Gemini
 * app in Chrome on the Mac mini, using JB's subscription — never an image
 * API, free or paid. Mirrors the Match Fit repo's dead-on-purpose
 * `generateStaticMedia` pattern (`@/lib/content-calendar/media-generation`).
 *
 * `generatePostImage` still has live callers (generateDailyBatch and
 * generateBatchSlot in ./generator.ts, reachable from
 * /api/cron/content-machine-daily, /api/cron/ni-content-daily,
 * /api/axon/ni-content, and /api/content-machine/generate when the caller
 * passes withImages / images=1), so instead of throwing it now queues a
 * mini-Chrome job for the Mac mini and returns null immediately — there is
 * no image URL to hand back synchronously any more. The queued row is
 * picked up by whatever polls `nvg_mini_jobs` on the mini, and the resulting
 * image gets attached to the post out of band.
 */
import { createServiceClient } from "@/lib/supabase/server";

export async function generatePostImage(args: {
  visualPrompt: string;
  brandSlug: string;
  postId?: string | null;
}): Promise<string | null> {
  const prompt = [
    args.visualPrompt,
    "Match Fit brand: dark backdrop #07080C with orange #FF7E00 accents.",
    "Social media marketing image, scroll-stopping, professional fitness aesthetic.",
    "No watermarks, no stock photo feel.",
  ].join(" ");

  await queueMiniChromeMediaJob({
    prompt,
    targetPostId: args.postId ?? null,
    brandSlug: args.brandSlug,
  });

  // Media is produced later, by hand, in the Gemini app on the Mac mini —
  // never synchronously here. Callers must treat a null return as
  // "queued, not ready yet", not as a failure.
  return null;
}

async function queueMiniChromeMediaJob(args: {
  prompt: string;
  targetPostId: string | null;
  brandSlug: string;
}): Promise<void> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from("nvg_mini_jobs").insert({
      kind: "chrome_gemini_media",
      title: `Content Machine media — ${args.brandSlug}`,
      payload: { prompt: args.prompt, target_post_id: args.targetPostId },
      status: "queued",
    });
    if (error) {
      console.warn(
        "[content-machine/image-gen] queue mini-chrome job failed:",
        error.message
      );
    }
  } catch (err) {
    console.warn("[content-machine/image-gen] queue mini-chrome job threw:", err);
  }
}
