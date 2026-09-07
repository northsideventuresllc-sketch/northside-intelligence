/**
 * Content Machine media prompt handling (CM4).
 *
 * NI-IMAGE-GEN-DIRECT-GEMINI-API-0906: this file used to call
 * generativelanguage.googleapis.com directly to generate the image itself.
 * That is disabled by policy (NI-Brain Decision #1722 item 4, JB direct,
 * 2026-09-03): social media images/video are generated ONLY in the Gemini
 * app in Chrome on the Mac mini, using JB's subscription — never an image
 * API, free or paid. Mirrors the Match Fit repo's dead-on-purpose
 * `generateStaticMedia` pattern (`@/lib/content-calendar/media-generation`).
 *
 * First fix (PR #211) queued an `nvg_mini_jobs` row of kind
 * `chrome_gemini_media` for the Mac mini to pick up. Council review (row 228)
 * rejected that: `nvg-mini-runner.py` (the Mac mini poller, outside this repo)
 * only executes jobs of kind `shell`, and the media-loop consumer for
 * `chrome_gemini_media` is a separate, not-yet-built ticket
 * (BPA-B2-MEDIA-LOOP-0906). A queued row nothing will ever pick up is worse
 * than none, so this file queues NOTHING — no network call, no database
 * write, no `nvg_mini_jobs` insert.
 *
 * `generatePostImage` still has live callers (generateDailyBatch and
 * generateBatchSlot in ./generator.ts, reachable from
 * /api/cron/content-machine-daily, /api/cron/ni-content-daily,
 * /api/axon/ni-content, and /api/content-machine/generate when the caller
 * passes withImages / images=1). It now just builds the same prompt text the
 * old Gemini call used to send, logs one line, and returns null — the caller
 * stores that prompt directly on the post's own `meta.media_prompt` /
 * `meta.media_status` when it inserts the row (see generator.ts), so a human
 * — or the future BPA-B2 media loop, once it exists — can read it straight
 * off the post. No queue table, no consumer dependency.
 */

/** Same prompt text the old direct Gemini call used to send. Exported so
 * generator.ts can store the exact prompt on the post's meta without this
 * file touching the database. */
export function buildMediaPrompt(visualPrompt: string): string {
  return [
    visualPrompt,
    "Match Fit brand: dark backdrop #07080C with orange #FF7E00 accents.",
    "Social media marketing image, scroll-stopping, professional fitness aesthetic.",
    "No watermarks, no stock photo feel.",
  ].join(" ");
}

export async function generatePostImage(args: {
  visualPrompt: string;
  brandSlug: string;
}): Promise<string | null> {
  console.log(
    "[content-machine/image-gen] media pending: generated in the Gemini app on the Mac mini (BPA-B2)"
  );

  // No API, no queue. The prompt is generated above only so the log line
  // and generator.ts's stored meta.media_prompt come from one source of
  // truth (buildMediaPrompt) — nothing here reaches the network or a table.
  void buildMediaPrompt(args.visualPrompt);
  void args.brandSlug;

  return null;
}
