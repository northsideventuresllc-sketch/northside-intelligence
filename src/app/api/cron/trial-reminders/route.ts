import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  sendTrialExpiryReminderEmail,
  notifyPortal,
} from "@/lib/billing/trial-flow";

const TOOL_LABELS: Record<string, string> = {
  replyflow: "ReplyFlow",
  grantbot: "GrantBot",
  signaldesk: "SignalDesk",
  gapscan: "GapScan",
  bridgeai: "BridgeAI",
};

/**
 * GET /api/cron/trial-reminders
 * Sends "trial expires tomorrow" email + portal notification for trials
 * ending in the next 24-30 hours. Idempotent via metadata flag.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const windowStart = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 30 * 60 * 60 * 1000).toISOString();

  const { data: expiring, error } = await supabase
    .from("ni_toolkit")
    .select("user_id, tool_slug, expires_at")
    .eq("access_type", "trial")
    .gte("expires_at", windowStart)
    .lte("expires_at", windowEnd);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const remindedKey = (userId: string, slug: string) =>
    `trial-reminder-sent:${userId}:${slug}`;

  for (const row of expiring ?? []) {
    const userId = row.user_id as string;
    const slug = row.tool_slug as string;
    // Skip if already reminded (check via a lightweight marker in ni_toolkit metadata is not available;
    // use trial_codes metadata instead)
    const { data: codeRow } = await supabase
      .from("trial_codes")
      .select("id, metadata")
      .eq("user_id", userId)
      .not("used_at", "is", null)
      .order("used_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const meta = (codeRow?.metadata ?? {}) as Record<string, unknown>;
    if (meta[remindedKey(userId, slug)]) continue;

    // Get user email
    const { data: profile } = await supabase
      .from("ni_portal_profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    const email = (profile as { email?: string } | null)?.email;
    const toolName = TOOL_LABELS[slug] ?? slug;

    try {
      if (email) {
        await sendTrialExpiryReminderEmail(email, toolName, row.expires_at as string);
      }
      await notifyPortal(
        userId,
        "trial_reminder",
        "Your trial expires tomorrow",
        `Your free trial of ${toolName} ends tomorrow. Your card on file will be charged unless you cancel.`,
        "/toolkit"
      );
      // Mark reminded
      if (codeRow) {
        await supabase
          .from("trial_codes")
          .update({ metadata: { ...meta, [remindedKey(userId, slug)]: true } })
          .eq("id", codeRow.id);
      }
      sent++;
    } catch (err) {
      console.error("[trial-reminders] failed for", userId, slug, err);
    }
  }

  return NextResponse.json({ sent, checked: (expiring ?? []).length });
}
