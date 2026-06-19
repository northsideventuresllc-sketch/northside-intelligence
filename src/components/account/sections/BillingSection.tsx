"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { NiPricingGrid } from "@/components/billing/NiPricingGrid";
import { MasterAccountPreview } from "@/components/account/MasterAccountPreview";
import {
  MASTER_ACCOUNT_DESCRIPTION,
  MASTER_ACCOUNT_LABEL,
} from "@/lib/billing/master-account";
import {
  canDowngradeNiTier,
  getDowngradeCheckoutPayload,
  getNextNiTier,
  getUpgradeCheckoutPayload,
} from "@/lib/billing/subscription-actions";
import { getNiTierConfig, type NiTier } from "@/lib/billing/ni-tiers";
import type { AccountPageData } from "@/lib/account/get-account-page-data";

interface BillingSectionProps {
  billing: AccountPageData["billing"];
}

export function BillingSection({ billing }: BillingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [annual, setAnnual] = useState(billing.billingInterval === "annual");

  const niTier = billing.niTier as NiTier;
  const upgradePayload = getUpgradeCheckoutPayload({
    niTier,
    billingInterval: billing.billingInterval,
  } as Parameters<typeof getUpgradeCheckoutPayload>[0]);
  const downgradePayload = getDowngradeCheckoutPayload({
    niTier,
    billingInterval: billing.billingInterval,
  } as Parameters<typeof getDowngradeCheckoutPayload>[0]);
  const nextTier = getNextNiTier(niTier);
  const canDowngrade = canDowngradeNiTier(niTier);
  const hasNiSubscription = !!billing.niStripeSubscriptionId;
  const hasToolSubscriptions = billing.toolSubscriptions.length > 0;
  const hasAnyPausableSubscription = hasNiSubscription || hasToolSubscriptions;

  async function openBillingPortal() {
    setSubscriptionError("");
    setLoading("billing");
    try {
      const res = await fetch("/api/account/billing/portal", { method: "POST" });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setSubscriptionError(data.error ?? "Billing portal unavailable");
        return;
      }
      window.location.href = data.url;
    } catch {
      setSubscriptionError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSubscriptionAction(
    action: "pause" | "cancel" | "resume",
    options?: { context?: "portal" | "tool"; toolSlug?: string }
  ) {
    setSubscriptionError("");
    setSubscriptionMessage("");
    setLoading(action);
    try {
      const endpoint =
        action === "pause"
          ? "/api/account/billing/pause"
          : action === "cancel"
            ? "/api/account/billing/cancel"
            : "/api/account/billing/resume";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options ?? {}),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setSubscriptionError(data.error ?? `Unable to ${action} subscription`);
        return;
      }
      setSubscriptionMessage(data.message ?? `Subscription ${action}d.`);
    } catch {
      setSubscriptionError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const billingContent = (
    <div className="space-y-6">
      {billing.isMasterAccount ? (
        <>
          <p className="text-sm text-ni-muted">Current NI plan</p>
          <p className="text-xl font-semibold text-white">Master Account</p>
          <p className="text-sm text-ni-muted">
            {billing.toolkitCount} tool{billing.toolkitCount === 1 ? "" : "s"} in your Toolkit
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-ni-muted">Current NI plan</p>
          <p className="text-xl font-semibold capitalize text-white">{billing.niTier}</p>
          {billing.billingInterval && (
            <p className="text-sm capitalize text-ni-muted">{billing.billingInterval} billing</p>
          )}
          <p className="text-sm text-ni-muted">
            {billing.toolkitCount} tool{billing.toolkitCount === 1 ? "" : "s"} in your Toolkit
          </p>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        {nextTier && upgradePayload && (
          <CheckoutButton
            label={`Upgrade to ${getNiTierConfig(nextTier).name}`}
            payload={upgradePayload}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          />
        )}

        {canDowngrade && downgradePayload && (
          <CheckoutButton
            label={`Downgrade to ${getNiTierConfig(downgradePayload.tier).name}`}
            payload={downgradePayload}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
          />
        )}

        {canDowngrade && niTier !== "free" && !downgradePayload && (
          <button
            type="button"
            onClick={() => handleSubscriptionAction("cancel", { context: "portal" })}
            disabled={loading !== null}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {loading === "cancel" ? "Processing…" : "Downgrade to Free"}
          </button>
        )}

        {billing.hasStripeCustomer && (
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={loading === "billing"}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
          >
            {loading === "billing" ? "Loading…" : "Manage in Stripe"}
          </button>
        )}
      </div>

      {!billing.isMasterAccount && (
        <>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                !annual ? "bg-cyan-500/20 text-cyan-300" : "text-ni-muted hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                annual ? "bg-cyan-500/20 text-cyan-300" : "text-ni-muted hover:text-white"
              }`}
            >
              Annual
            </button>
          </div>

          <NiPricingGrid annual={annual} isLoggedIn niTier={niTier} />
        </>
      )}

      {!billing.isMasterAccount && hasAnyPausableSubscription && (
        <div className="border-t border-white/10 pt-6">
          <h3 className="mb-2 text-sm font-semibold text-white">Subscription Management</h3>
          <p className="mb-4 text-sm text-ni-muted">
            Pause billing temporarily or cancel your subscription.
          </p>
          {billing.currentPeriodEnd && (
            <p className="mb-4 text-xs text-ni-muted">
              Current period ends{" "}
              {new Date(billing.currentPeriodEnd).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            {hasNiSubscription && (
              <>
                <button
                  type="button"
                  onClick={() => handleSubscriptionAction("pause", { context: "portal" })}
                  disabled={loading !== null}
                  className="text-sm text-cyan-300 underline-offset-2 transition hover:underline disabled:opacity-50"
                >
                  {loading === "pause" ? "Pausing…" : "Pause Subscription"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscriptionAction("cancel", { context: "portal" })}
                  disabled={loading !== null}
                  className="text-sm text-ni-muted underline-offset-2 transition hover:text-red-300 hover:underline disabled:opacity-50"
                >
                  {loading === "cancel" ? "Canceling…" : "Cancel Subscription"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscriptionAction("resume")}
                  disabled={loading !== null}
                  className="text-sm text-emerald-300 underline-offset-2 transition hover:underline disabled:opacity-50"
                >
                  {loading === "resume" ? "Resuming…" : "Resume Subscription"}
                </button>
              </>
            )}
          </div>
          {hasToolSubscriptions && (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ni-muted">
                Tool Subscriptions
              </p>
              {billing.toolSubscriptions.map((sub) => (
                <div key={sub.toolSlug} className="flex flex-wrap items-center gap-4">
                  <span className="text-sm capitalize text-white">{sub.toolSlug}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleSubscriptionAction("pause", { context: "tool", toolSlug: sub.toolSlug })
                    }
                    disabled={loading !== null}
                    className="text-sm text-cyan-300 underline-offset-2 transition hover:underline disabled:opacity-50"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSubscriptionAction("cancel", { context: "tool", toolSlug: sub.toolSlug })
                    }
                    disabled={loading !== null}
                    className="text-sm text-ni-muted underline-offset-2 transition hover:text-red-300 hover:underline disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subscriptionMessage && (
        <p className="text-sm text-emerald-300" role="status">
          {subscriptionMessage}
        </p>
      )}
      {subscriptionError && (
        <p className="text-sm text-red-300" role="alert">
          {subscriptionError}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {billing.isMasterAccount && (
        <section className="rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300/90">
            {MASTER_ACCOUNT_LABEL}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{MASTER_ACCOUNT_DESCRIPTION}</p>
        </section>
      )}

      <section className="glass-panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Billing</h2>
        {billing.isMasterAccount ? (
          <MasterAccountPreview enabled>{billingContent}</MasterAccountPreview>
        ) : (
          billingContent
        )}
      </section>

      <p className="text-center text-sm text-ni-muted">
        Need help choosing a plan?{" "}
        <Link href="/#pricing" className="text-cyan-300 hover:underline">
          Compare NI Subscriptions
        </Link>
      </p>
    </div>
  );
}
