import "server-only";

import { sendStoreOrderCancelledEmail } from "@/lib/store/order-emails";
import { createServiceClient } from "@/lib/supabase/server";

export interface ReconciliationCronResult {
  cancelled: number;
  orderIds: string[];
}

const CANCELLATION_REASON =
  "We did not receive the required payment or fulfillment action within 72 hours. If you were charged, any eligible refund will be processed separately.";

export async function cancelExpiredStoreReconciliationOrders(): Promise<ReconciliationCronResult> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("ni_store_orders")
    .select("id, customer_email, status, reconciliation_status")
    .in("reconciliation_status", ["failed_charge", "action_required"])
    .lt("fulfillment_deadline_at", now)
    .neq("status", "cancelled");

  if (error) throw new Error(error.message);

  const orderIds: string[] = [];

  for (const row of rows ?? []) {
    const orderId = String(row.id);
    const { error: updateError } = await supabase
      .from("ni_store_orders")
      .update({
        status: "cancelled",
        reconciliation_status: "cancelled",
        updated_at: now,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("[store/reconciliation-cron] cancel failed", orderId, updateError.message);
      continue;
    }

    orderIds.push(orderId);

    const email = row.customer_email ? String(row.customer_email) : null;
    if (email) {
      await sendStoreOrderCancelledEmail({
        to: email,
        orderId,
        reason: CANCELLATION_REASON,
      });
    }
  }

  return { cancelled: orderIds.length, orderIds };
}
