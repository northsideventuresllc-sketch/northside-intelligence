import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/infra/cron-auth";
import { purgeExpiredEmailCaptures } from "@/lib/tracking/email-capture";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Hourly 72h retention enforcement (WS10).
 *
 * Deletes every `email_captures` row with expires_at < now(). Declared in
 * vercel.json crons ("0 * * * *"). JB scoped retention to 72h minimum AND
 * maximum — no row may outlive 72h from its last capture plus one cron
 * interval. Authorized via the standard cron auth (x-vercel-cron / CRON_SECRET).
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deleted } = await purgeExpiredEmailCaptures();
  return NextResponse.json({ ok: true, deleted });
}
