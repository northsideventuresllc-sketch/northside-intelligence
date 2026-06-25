import { NextResponse } from "next/server";
import { cancelExpiredStoreReconciliationOrders } from "@/lib/store/order-reconciliation-cron";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cancelExpiredStoreReconciliationOrders();
  return NextResponse.json(result);
}
