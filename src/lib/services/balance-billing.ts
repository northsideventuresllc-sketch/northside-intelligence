import "server-only";

import type Stripe from "stripe";
import { ensureBillingEnvHydrated, getBillingStripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { getServiceBySlug } from "@/lib/services/offerings";
import { DEPOSIT_META, DEPOSIT_SHARE } from "@/lib/services/deposit";

/**
 * Balance billing for Intelligence Services deposits (JB, Decisions #1996 / #1995,
 * 2026-09-23). Deposits come from two places with no shared table:
 *  - Portal checkout writes `payload.deposit` onto an `ni_service_requests` row.
 *  - The AI-agent storefront only exists as a Stripe Checkout Session
 *    (metadata.source = "webmcp", metadata.tool = "ni_services_reserve") — there is
 *    no DB row for it, so it is listed straight from Stripe.
 * A balance is only ever charged by an explicit operator action; nothing here runs
 * on its own.
 */

const MAX_FINAL_TOTAL_CENTS = 100_000_000; // $1,000,000 sanity cap
const AGENT_SESSION_LIST_PAGES = 5; // 5 * 100 = 500 most-recent sessions scanned
const AGENT_SESSION_PAGE_SIZE = 100;

export type PendingBalanceSource = "portal" | "agent";

export interface PendingServiceBalance {
  /** Opaque id the UI round-trips back on charge — never a bare Stripe id. */
  id: string;
  source: PendingBalanceSource;
  clientEmail: string;
  serviceName: string;
  serviceSlug: string;
  depositCents: number;
  /** Total the deposit was quoted against — the operator's starting point, editable. */
  defaultTotalCents: number;
  defaultBalanceCents: number;
  depositPaidAt: string | null;
  customerId: string;
  paymentMethodId: string | null;
  depositPaymentIntentId: string;
  portalRequestId: string | null;
  checkoutSessionId: string | null;
  /** Stripe Checkout Session of an outstanding "send this link" balance follow-up, if any. */
  followUpSessionId: string | null;
}

export interface ChargeBalanceResult {
  ok: boolean;
  outcome: "charged" | "requires_followup";
  amountCents: number;
  paymentIntentId?: string;
  fallbackCheckoutUrl?: string;
  message: string;
}

function readIntMeta(metadata: Stripe.Metadata | null | undefined, key: string): number | null {
  const raw = metadata?.[key];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function fallbackTotalFromDeposit(depositCents: number): number {
  return Math.max(depositCents, Math.round(depositCents / DEPOSIT_SHARE));
}

function serviceNameFor(slug: string): string {
  return getServiceBySlug(slug)?.name ?? slug;
}

/** Rows already billed carry `payload.balance` recording a successful charge. */
function portalBalanceAlreadyCharged(payload: Record<string, unknown>): boolean {
  const balance = payload?.balance as { status?: string } | undefined;
  return balance?.status === "succeeded";
}

async function listPortalPendingBalances(): Promise<PendingServiceBalance[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("ni_service_requests")
    .select("id, service_slug, payload, status, agreed_price_cents, created_at")
    .not("payload->deposit", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const rows: PendingServiceBalance[] = [];
  for (const row of data ?? []) {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    if (portalBalanceAlreadyCharged(payload)) continue;

    const deposit = payload.deposit as
      | {
          customer_id?: string;
          payment_intent_id?: string;
          payment_method_id?: string;
          deposit_cents?: number;
          total_cents?: number;
          balance_cents?: number;
          paid_at?: string;
        }
      | undefined;

    if (!deposit?.customer_id || !deposit?.payment_intent_id || !deposit?.deposit_cents) {
      // Malformed/incomplete deposit record — skip rather than guess at money.
      continue;
    }

    const depositCents = Math.round(deposit.deposit_cents);
    const defaultTotalCents = deposit.total_cents
      ? Math.round(deposit.total_cents)
      : fallbackTotalFromDeposit(depositCents);

    rows.push({
      id: `portal:${row.id}`,
      source: "portal",
      clientEmail:
        typeof payload.email === "string" && payload.email
          ? payload.email
          : "Unknown client",
      serviceName: serviceNameFor(String(row.service_slug)),
      serviceSlug: String(row.service_slug),
      depositCents,
      defaultTotalCents,
      defaultBalanceCents: Math.max(0, defaultTotalCents - depositCents),
      depositPaidAt: deposit.paid_at ?? null,
      customerId: deposit.customer_id,
      paymentMethodId: deposit.payment_method_id ?? null,
      depositPaymentIntentId: deposit.payment_intent_id,
      portalRequestId: String(row.id),
      checkoutSessionId: null,
      followUpSessionId:
        typeof (payload.balance as { fallback_session_id?: unknown } | undefined)?.fallback_session_id === "string"
          ? ((payload.balance as { fallback_session_id: string }).fallback_session_id)
          : null,
    });
  }
  return rows;
}

async function listAgentPendingBalances(): Promise<PendingServiceBalance[]> {
  await ensureBillingEnvHydrated();
  const stripe = getBillingStripe();

  const results: PendingServiceBalance[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < AGENT_SESSION_LIST_PAGES; page += 1) {
    const sessions = await stripe.checkout.sessions.list({
      limit: AGENT_SESSION_PAGE_SIZE,
      starting_after: startingAfter,
      expand: ["data.payment_intent", "data.customer"],
    });

    for (const session of sessions.data) {
      if (session.metadata?.source !== "webmcp") continue;
      if (session.metadata?.tool !== "ni_services_reserve") continue;
      if (session.payment_status !== "paid") continue;

      const pi = session.payment_intent;
      if (!pi || typeof pi === "string") continue; // expand failed/expired session
      if (pi.metadata?.[DEPOSIT_META.flag] !== "true") continue;
      if (pi.metadata?.balanceChargedPaymentIntent) continue; // already billed

      const depositCents = readIntMeta(pi.metadata, DEPOSIT_META.depositCents);
      if (!depositCents) continue;

      const customerId =
        typeof pi.customer === "string"
          ? pi.customer
          : pi.customer?.id ?? (typeof session.customer === "string" ? session.customer : session.customer?.id);
      if (!customerId) continue; // no saved card to charge later — nothing to bill

      const paymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id ?? null;

      const totalFromMeta = readIntMeta(pi.metadata, DEPOSIT_META.totalCents);
      const defaultTotalCents = totalFromMeta ?? fallbackTotalFromDeposit(depositCents);

      const sessionCustomer = typeof session.customer !== "string" ? session.customer : null;
      const clientEmail =
        session.customer_details?.email ??
        (sessionCustomer && !sessionCustomer.deleted ? sessionCustomer.email ?? undefined : undefined) ??
        "Unknown client";

      const serviceSlug = pi.metadata?.[DEPOSIT_META.serviceSlug] ?? "unknown-service";

      results.push({
        id: `agent:${pi.id}`,
        source: "agent",
        clientEmail,
        serviceName: serviceNameFor(serviceSlug),
        serviceSlug,
        depositCents,
        defaultTotalCents,
        defaultBalanceCents: Math.max(0, defaultTotalCents - depositCents),
        depositPaidAt: pi.created ? new Date(pi.created * 1000).toISOString() : null,
        customerId,
        paymentMethodId,
        depositPaymentIntentId: pi.id,
        portalRequestId: null,
        checkoutSessionId: session.id,
        followUpSessionId: pi.metadata?.balanceFollowUpSession || null,
      });
    }

    if (!sessions.has_more || sessions.data.length === 0) break;
    startingAfter = sessions.data[sessions.data.length - 1]?.id;
  }

  return results;
}

/** Every deposit awaiting a balance charge, from both sources, newest first. */
export async function listPendingServiceBalances(): Promise<PendingServiceBalance[]> {
  const [portal, agent] = await Promise.all([
    listPortalPendingBalances(),
    listAgentPendingBalances(),
  ]);
  return [...portal, ...agent].sort((a, b) => {
    const at = a.depositPaidAt ? Date.parse(a.depositPaidAt) : 0;
    const bt = b.depositPaidAt ? Date.parse(b.depositPaidAt) : 0;
    return bt - at;
  });
}

export async function findPendingServiceBalance(id: string): Promise<PendingServiceBalance | null> {
  const all = await listPendingServiceBalances();
  return all.find((row) => row.id === id) ?? null;
}

/** Validates an operator-entered final total against a fresh row. Throws on anything unsafe. */
export function resolveFinalTotalCents(
  row: PendingServiceBalance,
  requestedFinalTotalCents: unknown
): { finalTotalCents: number; balanceCents: number } {
  let finalTotalCents = row.defaultTotalCents;

  if (requestedFinalTotalCents !== undefined && requestedFinalTotalCents !== null) {
    if (
      typeof requestedFinalTotalCents !== "number" ||
      !Number.isInteger(requestedFinalTotalCents) ||
      requestedFinalTotalCents <= 0
    ) {
      throw new Error("Final total must be a whole number of cents greater than zero.");
    }
    if (requestedFinalTotalCents > MAX_FINAL_TOTAL_CENTS) {
      throw new Error("Final total is above the allowed maximum.");
    }
    finalTotalCents = requestedFinalTotalCents;
  }

  const balanceCents = Math.max(0, finalTotalCents - row.depositCents);
  if (balanceCents <= 0) {
    throw new Error("Nothing left to bill — the deposit already covers this total.");
  }

  return { finalTotalCents, balanceCents };
}

async function recordPortalOutcome(
  portalRequestId: string,
  outcome: {
    payment_intent_id?: string;
    amount_cents: number;
    status: "succeeded" | "requires_followup";
    charged_at: string;
    fallback_checkout_url?: string;
    fallback_session_id?: string;
  }
): Promise<void> {
  const admin = createServiceClient();
  const { data: current, error: readError } = await admin
    .from("ni_service_requests")
    .select("payload")
    .eq("id", portalRequestId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  const payload = { ...(current?.payload as Record<string, unknown> | undefined), balance: outcome };
  const update: Record<string, unknown> = { payload, updated_at: new Date().toISOString() };
  if (outcome.status === "succeeded") update.status = "completed";

  const { error } = await admin.from("ni_service_requests").update(update).eq("id", portalRequestId);
  if (error) throw new Error(error.message);
}

/**
 * Charges the remaining balance for a deposit. Never retries automatically on a
 * decline/authentication failure — instead it creates a Checkout Session the
 * operator can send to the client, and reports that back rather than the charge
 * itself failing silently.
 */
export async function chargeServiceBalance(
  row: PendingServiceBalance,
  finalTotalCents: number,
  balanceCents: number
): Promise<ChargeBalanceResult> {
  await ensureBillingEnvHydrated();
  const stripe = getBillingStripe();

  // Never charge the saved card while an earlier "send this link" follow-up could also be paid.
  if (row.followUpSessionId) {
    const prior = await stripe.checkout.sessions.retrieve(row.followUpSessionId);
    if (prior.payment_status === "paid") {
      const piId = typeof prior.payment_intent === "string" ? prior.payment_intent : prior.payment_intent?.id;
      await recordOutcomeForRow(row, {
        payment_intent_id: piId ?? undefined,
        amount_cents: prior.amount_total ?? 0,
        status: "succeeded",
        charged_at: new Date().toISOString(),
      });
      return {
        ok: true,
        outcome: "charged",
        amountCents: prior.amount_total ?? 0,
        paymentIntentId: piId ?? undefined,
        message: "The client already paid the balance using the payment link. Nothing new was charged.",
      };
    }
    if (prior.status === "open") await stripe.checkout.sessions.expire(prior.id);
  }

  const baseMetadata: Record<string, string> = {
    serviceBalance: "true",
    depositPaymentIntentId: row.depositPaymentIntentId,
    serviceSlug: row.serviceSlug,
    source: row.source,
    finalTotalCents: String(finalTotalCents),
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: balanceCents,
        currency: "usd",
        customer: row.customerId,
        payment_method: row.paymentMethodId ?? undefined,
        off_session: true,
        confirm: true,
        metadata: baseMetadata,
      },
      // Blocks accidental double-submits (same amount within 10 minutes) but still lets the
      // operator retry later or with a corrected total after a declined card.
      { idempotencyKey: `balance:${row.depositPaymentIntentId}:${balanceCents}:${Math.floor(Date.now() / 600_000)}` }
    );

    if (paymentIntent.status !== "succeeded") {
      throw Object.assign(new Error(`Unexpected balance charge status: ${paymentIntent.status}`), {
        code: "unexpected_status",
      });
    }

    await recordOutcomeForRow(row, {
      payment_intent_id: paymentIntent.id,
      amount_cents: balanceCents,
      status: "succeeded",
      charged_at: new Date().toISOString(),
    });

    return {
      ok: true,
      outcome: "charged",
      amountCents: balanceCents,
      paymentIntentId: paymentIntent.id,
      message: "Balance charged successfully.",
    };
  } catch (err) {
    const stripeErr = err as Stripe.errors.StripeError & { code?: string };
    const needsFollowUp =
      stripeErr?.code === "authentication_required" ||
      stripeErr?.type === "StripeCardError" ||
      stripeErr?.code === "card_declined";

    if (!needsFollowUp) throw err;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: row.customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: balanceCents,
            product_data: {
              name: `${row.serviceName} — Remaining Balance`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        ...baseMetadata,
        balanceFollowUp: "true",
        ...(row.portalRequestId ? { portalRequestId: row.portalRequestId } : {}),
      },
      success_url: `${portalAppUrl()}/services?balance=paid`,
      cancel_url: `${portalAppUrl()}/services?balance=cancelled`,
    });

    if (!checkoutSession.url) {
      throw new Error("Card could not be charged automatically, and a follow-up link could not be created.");
    }

    await recordOutcomeForRow(row, {
      amount_cents: balanceCents,
      status: "requires_followup",
      charged_at: new Date().toISOString(),
      fallback_checkout_url: checkoutSession.url,
      fallback_session_id: checkoutSession.id,
    });

    return {
      ok: true,
      outcome: "requires_followup",
      amountCents: balanceCents,
      fallbackCheckoutUrl: checkoutSession.url,
      message:
        "The saved card could not be charged automatically. A payment link was created — send it to the client.",
    };
  }
}

async function recordOutcomeForRow(
  row: PendingServiceBalance,
  outcome: {
    payment_intent_id?: string;
    amount_cents: number;
    status: "succeeded" | "requires_followup";
    charged_at: string;
    fallback_checkout_url?: string;
    fallback_session_id?: string;
  }
): Promise<void> {
  if (row.source === "portal" && row.portalRequestId) {
    await recordPortalOutcome(row.portalRequestId, outcome);
    return;
  }

  // Agent booking — no DB row. Record on the deposit PaymentIntent's own metadata
  // so the next list pass excludes it (a successful charge) or so the operator can
  // see the follow-up link was already sent (checked via the fallback response).
  await ensureBillingEnvHydrated();
  const stripe = getBillingStripe();
  if (outcome.status === "succeeded") {
    await stripe.paymentIntents.update(row.depositPaymentIntentId, {
      metadata: { balanceChargedPaymentIntent: outcome.payment_intent_id ?? "paid" },
    });
  } else if (outcome.fallback_session_id) {
    await stripe.paymentIntents.update(row.depositPaymentIntentId, {
      metadata: { balanceFollowUpSession: outcome.fallback_session_id },
    });
  }
  // A "requires_followup" outcome for an agent booking is not persisted anywhere —
  // the operator has the link in the response to send; re-running list will surface
  // it again until it is actually charged, which is intentional (no silent retry).
}

function portalAppUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (base?.startsWith("http")) return base.replace(/\/$/, "");
  if (base) return `https://${base}`;
  return "https://www.northsideintelligence.com";
}

/**
 * Webhook hook: a client paid a balance follow-up link. Marks the balance as paid so the
 * operator list clears it and no second charge can be made against the saved card.
 */
export async function reconcileBalanceFollowUpPaid(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};
  if (meta.serviceBalance !== "true" || meta.balanceFollowUp !== "true") return;
  if (session.payment_status !== "paid") return;
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const outcome = {
    payment_intent_id: piId ?? undefined,
    amount_cents: session.amount_total ?? 0,
    status: "succeeded" as const,
    charged_at: new Date().toISOString(),
  };
  if (meta.source === "portal" && meta.portalRequestId) {
    await recordPortalOutcome(meta.portalRequestId, outcome);
    return;
  }
  if (meta.source === "agent" && meta.depositPaymentIntentId) {
    await ensureBillingEnvHydrated();
    await getBillingStripe().paymentIntents.update(meta.depositPaymentIntentId, {
      metadata: { balanceChargedPaymentIntent: piId ?? "paid" },
    });
  }
}
