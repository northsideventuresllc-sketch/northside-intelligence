import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/infra/cron-auth";
import { cancelExpiredStoreReconciliationOrders } from "@/lib/store/order-reconciliation-cron";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cancelExpiredStoreReconciliationOrders();
  return NextResponse.json(result);
}
