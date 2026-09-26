import { ensureBillingEnvHydrated, getBillingConfigError, getBillingStripe } from "@/lib/billing/stripe";
import { getCachedFulfilment, saveFulfilment } from "./fulfilment-cache";
import type { ToolHandler, ToolModule } from "./types";

export function makeOrderStatusHandler(modules: Record<string, ToolModule>): ToolHandler {
  return async (_tool, params, ctx) => {
    const orderId = typeof params.order_id === "string" ? params.order_id : "";
    if (!orderId.startsWith("cs_")) return { status: "invalid_input", message: "order_id must be the id returned by checkout." };
    await ensureBillingEnvHydrated();
    if (getBillingConfigError()) return { status: "unavailable", message: "Order lookup is temporarily unavailable." };

    const session = await getBillingStripe().checkout.sessions.retrieve(orderId);
    if (session.metadata?.source !== "webmcp") return { status: "invalid_input", message: "Unknown order." };
    const toolName = session.metadata.tool;
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return { status: "awaiting_payment", checkout_url: session.url ?? "", order_id: orderId, amount_usd: (session.amount_total ?? 0) / 100, message: "Payment not received yet." };
    }

    const cached = await getCachedFulfilment(ctx, orderId);
    if (cached) return { status: "ok", data: { order_id: orderId, tool: toolName, paid: true, result: cached } };

    const mod = modules[toolName];
    if (!mod?.fulfil) return { status: "ok", data: { order_id: orderId, tool: toolName, paid: true, result: { message: "Payment received. Northside Intelligence will follow up by email." } } };

    let orderParams: Record<string, unknown> = {};
    try { orderParams = JSON.parse(session.metadata.params || "{}"); } catch { /* keep empty */ }
    const order = { id: session.id, customer_email: session.customer_details?.email ?? session.customer_email ?? null, amount_total: session.amount_total, metadata: session.metadata as Record<string, string> };
    const result = await mod.fulfil(order, orderParams, ctx);
    await saveFulfilment(ctx, orderId, toolName, result);
    return { status: "ok", data: { order_id: orderId, tool: toolName, paid: true, result } };
  };
}
