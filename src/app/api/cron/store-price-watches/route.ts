import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/infra/cron-auth";
import { checkPriceWatchesAndNotify } from "@/lib/store/user-features";
import { purgeExpiredArchivedConversations } from "@/lib/sector3-tools/conversations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [priceAlerts, purgedConversations] = await Promise.all([
    checkPriceWatchesAndNotify(),
    purgeExpiredArchivedConversations(),
  ]);

  return NextResponse.json({ priceAlerts, purgedConversations });
}
