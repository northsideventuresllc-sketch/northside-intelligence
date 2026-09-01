import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { readPlatformSecret } from "../_shared/platform-secrets.ts";

Deno.serve(async (req: Request) => {
  try {
    const { text, chat_id, parse_mode } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const botToken = await readPlatformSecret("TELEGRAM_BOT_TOKEN");
    const defaultChatId = await readPlatformSecret("TELEGRAM_CHAT_ID");
    const targetChatId = chat_id || defaultChatId;

    if (!botToken || !targetChatId) {
      return new Response(JSON.stringify({ error: "missing bot token or chat id" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Telegram hard caps a single sendMessage at 4096 UTF-16 code units.
    // Split on that boundary instead of letting Telegram (or an upstream caller)
    // silently truncate mid-sentence - this is the truncation bug flagged
    // alongside this build request.
    const MAX_LEN = 4096;
    const chunks: string[] = [];
    let remaining = String(text);
    while (remaining.length > 0) {
      if (remaining.length <= MAX_LEN) {
        chunks.push(remaining);
        break;
      }
      const newlineCut = remaining.lastIndexOf("\n", MAX_LEN);
      const hardCut = newlineCut < MAX_LEN * 0.5; // no good newline break, hard-cut
      const cut = hardCut ? MAX_LEN : newlineCut;
      chunks.push(remaining.slice(0, cut));
      remaining = remaining.slice(hardCut ? cut : cut + 1); // drop the newline itself, don't leak it into the next chunk
    }

    const results = [];
    for (const chunk of chunks) {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: chunk,
          ...(parse_mode ? { parse_mode } : {}),
        }),
      });
      results.push(await tgRes.json());
    }

    const allOk = results.every((r: any) => r.ok);
    return new Response(JSON.stringify({ ok: allOk, chunks: results.length, results }), {
      status: allOk ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
