/**
 * Content Machine post images (CM4).
 *
 * Decision #1722 item 4: social media images/video are generated ONLY in JB's
 * Gemini app in Chrome on the Mac mini, never via an image API, free or paid.
 * This used to call generativelanguage.googleapis.com directly — replaced
 * 2026-09-07 (BUILD dispatch NI-IMAGE-GEN-DIRECT-GEMINI-API-0906) with the
 * same Mac-mini Chrome/Gemini-Pro job-queue pattern matchfit's
 * queueMiniChromeAgentJob (src/lib/content-calendar/cowork-jobs.ts) uses.
 *
 * Fire-and-forget: queues scripts/gemini-content-machine-image.mjs on the mini
 * via nvg_mini_jobs and returns immediately. The mini writes image_url back
 * onto the post row asynchronously once generation finishes — this function
 * never returns an image URL synchronously the way the old API call did.
 */
export async function queueContentMachineImageJob(args: {
  postId: string;
  brandSlug: string;
}): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.warn("[content-machine/image-gen] Supabase env not set — skipping image job queue");
    return;
  }

  // Reuses matchfit's already-provisioned $HOME/nvg-gemini-automation directory on the mini
  // (dedicated automation Chrome profile + playwright-core/sharp already installed there) —
  // curls this repo's script in fresh rather than standing up a second automation directory.
  const launcher =
    "mkdir -p $HOME/nvg-gemini-automation && curl -fsSL https://raw.githubusercontent.com/northsideventuresllc-sketch/matchfit/main/scripts/mini-chrome-automation-launcher.sh -o $HOME/nvg-gemini-automation/mini-chrome-automation-launcher.sh && zsh $HOME/nvg-gemini-automation/mini-chrome-automation-launcher.sh >/dev/null 2>&1; sleep 3;";
  const cmd = `${launcher} cd $HOME/nvg-gemini-automation && curl -fsSL https://raw.githubusercontent.com/northsideventuresllc-sketch/northside-intelligence/main/scripts/gemini-content-machine-image.mjs -o gemini-content-machine-image.mjs && node gemini-content-machine-image.mjs --ids=${args.postId} 2>&1`;

  const res = await fetch(`${supabaseUrl}/rest/v1/nvg_mini_jobs`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: "shell",
      title: `content-machine-image:${args.brandSlug}:${args.postId.slice(0, 8)}`,
      payload: { cmd, timeout: 600 },
    }),
  });
  if (!res.ok) {
    console.warn("[content-machine/image-gen] mini job queue failed:", res.status, await res.text().catch(() => ""));
  }
}
