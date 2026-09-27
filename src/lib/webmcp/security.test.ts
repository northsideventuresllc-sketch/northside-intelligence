import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression tests for the WebMCP buyer-tool security gap closed by NI-Brain
 * Decision #2049 (draft PR #280 would have let an anonymous caller write an
 * active `ni_subscriptions` row with fabricated Stripe ids, and a $499
 * `ni_service_requests` row under a made-up buyer with JB's account as the
 * fallback owner).
 *
 * The fix actually merged to `main` (feat/webmcp real-payments rewrite, #269)
 * took a different — stronger — shape than "add a portal auth check": a
 * write-capable webmcp tool call NEVER writes a subscription or service-request
 * row itself. It only creates a Stripe Checkout Session (`awaiting_payment`).
 * The row only exists once `ni_order_status` re-reads the Checkout Session
 * directly from Stripe (not from anything the caller supplied) and confirms
 * `payment_status === "paid"`. No fallback identity is used anywhere.
 *
 * These tests assert that shape holds, so it can't quietly regress back
 * toward PR #280's version.
 */

const checkoutSessionsCreate = vi.fn();
const checkoutSessionsRetrieve = vi.fn();

vi.mock("@/lib/billing/stripe", () => ({
  ensureBillingEnvHydrated: vi.fn().mockResolvedValue(undefined),
  getBillingConfigError: vi.fn().mockReturnValue(null),
  getBillingStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: checkoutSessionsCreate,
        retrieve: checkoutSessionsRetrieve,
      },
    },
  })),
}));

const supabaseFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({ from: supabaseFrom })),
}));

// Real module pulls in @/lib/hydrate-platform-env (a "server-only" module) purely to
// hydrate env vars from the DB — irrelevant to these tests, and not safely importable
// under vitest's node environment. Keep the real price ids, stub the hydration path.
vi.mock("@/lib/replyflow/stripe", () => ({
  REPLYFLOW_PRICE_IDS: { solo: "price_test_solo", team: "price_test_team", agency: "price_test_agency" },
}));

const JB_FALLBACK_ACCOUNT_ID = "7e82a9db-b86e-4f21-b797-99b6931c9728"; // the hardcoded fallback PR #280 introduced

import { handler as replyflowSubscribeHandler, fulfil as replyflowFulfil } from "./tools/ni_replyflow_subscribe";
import { handler as servicesReserveHandler, fulfil as servicesReserveFulfil } from "./tools/ni_services_reserve";
import { makeOrderStatusHandler } from "./order-status";
import type { ToolModule } from "./types";
import * as ni_replyflow_subscribe from "./tools/ni_replyflow_subscribe";
import * as ni_services_reserve from "./tools/ni_services_reserve";
import type { ToolContext } from "./types";

// A minimal module map for the order-status tests — avoids pulling in every other
// webmcp tool (store/sector3/grantbot) and their own real, unmocked dependencies.
const modules: Record<string, ToolModule> = { ni_replyflow_subscribe, ni_services_reserve };

const fakeCtx = () => ({ engine: "test", signature: "unsigned", req: {} as any, supabase: null }) as ToolContext;

beforeEach(() => {
  checkoutSessionsCreate.mockReset();
  checkoutSessionsRetrieve.mockReset();
  supabaseFrom.mockReset();
});

describe("ni_replyflow_subscribe — no anonymous free access", () => {
  it("an unauthenticated call never returns an active subscription — only a pending checkout, and writes nothing", async () => {
    checkoutSessionsCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/cs_test_123",
      amount_total: 1500,
    });

    const result = await replyflowSubscribeHandler(
      {} as any,
      { account_email: "buyer@example.com", tier: "solo" },
      fakeCtx()
    );

    expect(result.status).toBe("awaiting_payment");
    expect(result.status).not.toBe("ok");
    if (result.status === "awaiting_payment") {
      expect(result.order_id).toBe("cs_test_123");
    }
    // No DB row was written by the tool call itself.
    expect(supabaseFrom).not.toHaveBeenCalled();
    // Stripe was asked to create a real checkout session — not skipped.
    expect(checkoutSessionsCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects a request with no buyer email instead of substituting a fabricated one", async () => {
    const result = await replyflowSubscribeHandler({} as any, { tier: "solo" }, fakeCtx());
    expect(result.status).toBe("invalid_input");
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("fulfil() never claims the account is active — it always requires the buyer to sign in, never writes ni_subscriptions directly", async () => {
    const order = { id: "cs_test_123", customer_email: "buyer@example.com", amount_total: 1500, metadata: {} };
    const out = await replyflowFulfil!(order, { account_email: "buyer@example.com", plan: "solo" }, fakeCtx());
    expect(JSON.stringify(out)).not.toMatch(/"status":\s*"active"/);
    expect(supabaseFrom).not.toHaveBeenCalled();
  });
});

describe("ni_services_reserve — no fabricated buyer, no JB fallback", () => {
  it("an unauthenticated call only creates a pending deposit checkout, never a confirmed $499 service-request row", async () => {
    checkoutSessionsCreate.mockResolvedValue({
      id: "cs_test_456",
      url: "https://checkout.stripe.com/cs_test_456",
      amount_total: 5000,
    });

    const result = await servicesReserveHandler(
      {} as any,
      {
        service_type: "custom_web_design",
        client_name: "Real Buyer",
        client_email: "real-buyer@example.com",
      },
      fakeCtx()
    );

    expect(result.status).toBe("awaiting_payment");
    expect(supabaseFrom).not.toHaveBeenCalled();
  });

  it("rejects a request missing a real client_email rather than fabricating one", async () => {
    const result = await servicesReserveHandler(
      {} as any,
      { service_type: "custom_web_design", client_name: "Real Buyer" },
      fakeCtx()
    );
    expect(result.status).toBe("invalid_input");
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("never falls back to JB's account id anywhere in the reserve flow", async () => {
    checkoutSessionsCreate.mockResolvedValue({ id: "cs_test_789", url: "https://checkout.stripe.com/x", amount_total: 5000 });
    const result = await servicesReserveHandler(
      {} as any,
      { service_type: "custom_web_design", client_name: "Real Buyer", client_email: "real-buyer@example.com" },
      fakeCtx()
    );
    expect(JSON.stringify(result)).not.toContain(JB_FALLBACK_ACCOUNT_ID);

    const order = { id: "cs_test_789", customer_email: "real-buyer@example.com", amount_total: 5000, metadata: {} };
    const fulfilled = await servicesReserveFulfil!(
      order,
      { service_slug: "custom-web-design-management", client_name: "Real Buyer", client_email: "real-buyer@example.com" },
      fakeCtx()
    );
    expect(JSON.stringify(fulfilled)).not.toContain(JB_FALLBACK_ACCOUNT_ID);
  });
});

describe("ni_order_status — fulfillment only happens after Stripe itself confirms payment", () => {
  const handler = makeOrderStatusHandler(modules);

  it("does not fulfil (and reports awaiting_payment) when Stripe reports the session unpaid", async () => {
    checkoutSessionsRetrieve.mockResolvedValue({
      id: "cs_test_unpaid",
      payment_status: "unpaid",
      url: "https://checkout.stripe.com/cs_test_unpaid",
      amount_total: 1500,
      metadata: { source: "webmcp", tool: "ni_replyflow_subscribe", params: "{}" },
    });

    const result = await handler({} as any, { order_id: "cs_test_unpaid" }, fakeCtx());
    expect(result.status).toBe("awaiting_payment");
  });

  it("only fulfils once Stripe's own record shows the session paid — never trusts a client-supplied payment claim", async () => {
    checkoutSessionsRetrieve.mockResolvedValue({
      id: "cs_test_paid",
      payment_status: "paid",
      amount_total: 1500,
      customer_details: { email: "buyer@example.com" },
      metadata: {
        source: "webmcp",
        tool: "ni_replyflow_subscribe",
        params: JSON.stringify({ account_email: "buyer@example.com", plan: "solo" }),
      },
    });

    const result = await handler({} as any, { order_id: "cs_test_paid" }, fakeCtx());
    expect(result.status).toBe("ok");
  });

  it("rejects an order_id that isn't a real Stripe Checkout Session id, instead of trusting whatever the caller sends", async () => {
    const result = await handler({} as any, { order_id: "not-a-real-session" }, fakeCtx());
    expect(result.status).toBe("invalid_input");
    expect(checkoutSessionsRetrieve).not.toHaveBeenCalled();
  });
});

describe("regression guard: PR #280's hardcoded JB-fallback account id must never reappear", () => {
  it("is absent from the webmcp tool/dispatch/checkout source", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(__dirname);
    const filesToScan = [
      "dispatch.ts",
      "checkout.ts",
      "order-status.ts",
      "ingress-log.ts",
      path.join("tools", "ni_replyflow_subscribe.ts"),
      path.join("tools", "ni_services_reserve.ts"),
    ];
    for (const rel of filesToScan) {
      const contents = fs.readFileSync(path.join(dir, rel), "utf8");
      expect(contents).not.toContain(JB_FALLBACK_ACCOUNT_ID);
    }
  });
});
