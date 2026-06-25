import { NextResponse } from "next/server";
import { checkPriceWatchesAndNotify } from "@/lib/store/user-features";
import { purgeExpiredArchivedConversations } from "@/lib/sector3-tools/conversations";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [priceAlerts, purgedConversations] = await Promise.all([
    checkPriceWatchesAndNotify(),
    purgeExpiredArchivedConversations(),
  ]);

  return NextResponse.json({ priceAlerts, purgedConversations });
}
