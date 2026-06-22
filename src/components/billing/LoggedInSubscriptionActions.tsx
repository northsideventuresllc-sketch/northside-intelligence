"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { MasterAccountPreview } from "@/components/account/MasterAccountPreview";
import {
  canDowngradeNiTier,
  getCurrentPlanSummary,
  getDowngradeCheckoutPayload,
  getUpgradeCheckoutPayload,
  hasPausableSubscription,
  isHighestPaidNiTier,
} from "@/lib/billing/subscription-actions";
import type { UserBillingState } from "@/lib/billing/entitlements";
import { getNiTierConfig } from "@/lib/billing/ni-tiers";

type SubscriptionContext = "portal" | "tool";

interface LoggedInSubscriptionActionsProps {
  billingState: Pick<
    UserBillingState,
    | "niTier"
    | "billingInterval"
    | "isMasterAccount"
    | "niStripeSubscriptionId"
    | "toolkit"
  >;
  context?: SubscriptionContext;
  toolSlug?: string;
  variant?: "portal" | "replyflow" | "grantbot";
  className?: string;
}

export function LoggedInSubscriptionActions({
  billingState,
  context = "portal",
  toolSlug,
  variant = "portal",
  className = "",
}: LoggedInSubscriptionActionsProps) {
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseMessage, setPauseMessage] = useState("");
  const [pauseError, setPauseError] = useState("");

  const isReplyflow = variant === "replyflow";
  const isGrantbot = variant === "grantbot";
  const atHighestTier = isHighestPaidNiTier(billingState.niTier);
  const upgradePayload = getUpgradeCheckoutPayload(billingState as UserBillingState);
  const downgradePayload = getDowngradeCheckoutPayload(billingState as UserBillingState);
  const canPause = hasPausableSubscription(billingState as UserBillingState, context, toolSlug);
  const planSummary = getCurrentPlanSummary(billingState as UserBillingState);
  const canDowngrade = canDowngradeNiTier(billingState.niTier);

  const primaryButtonClass = isReplyflow
    ? "w-full rounded-2xl bg-gradient-to-r from-rf-rose via-rf-coral to-rf-violet px-6 py-3 text-sm font-semibold text-white shadow-rf-glow transition hover:scale-[1.02] hover:opacity-95 disabled:opacity-50"
    : isGrantbot
      ? "w-full rounded-2xl bg-gradient-to-r from-gb-emerald to-gb-amber px-6 py-3 text-sm font-semibold text-gb-bg shadow-gb-glow transition hover:scale-[1.02] hover:opacity-95 disabled:opacity-50"
      : "w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:opacity-50";

  const secondaryButtonClass = isReplyflow
    ? "w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-rf-rose/40 hover:bg-white/10 disabled:opacity-50"
    : isGrantbot
      ? "w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-gb-emerald/40 hover:bg-white/10 disabled:opacity-50"
      : "w-full rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-50";

  const billingLinkClass = isReplyflow
    ? "mt-4 inline-block text-rf-rose hover:underline"
    : isGrantbot
      ? "mt-4 inline-block text-gb-emerald hover:underline"
      : "mt-4 inline-block rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10";

  async function handlePause() {
    setPauseLoading(true);
    setPauseError("");
    setPauseMessage("");
    try {
      const res = await fetch("/api/account/billing/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, toolSlug }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setPauseError(data.error ?? "Unable to pause subscription");
        return;
      }
      setPauseMessage(data.message ?? "Subscription paused.");
    } catch {
      setPauseError("Network error. Please try again.");
    } finally {
      setPauseLoading(false);
    }
  }

  const actionContent = (
    <div className={`space-y-4 text-center ${className}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
          Your Plan
        </p>
        <p className="mt-2 text-xl font-semibold capitalize text-white">{planSummary.tierName}</p>
        <p className={`mt-1 text-sm ${isReplyflow ? "text-rf-muted" : isGrantbot ? "text-gb-muted" : "text-ni-muted"}`}>
          {planSummary.description}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {!atHighestTier && upgradePayload && (
          <CheckoutButton
            label="Upgrade Plan"
            payload={upgradePayload}
            className={primaryButtonClass}
          />
        )}

        {canDowngrade && downgradePayload && (
          <CheckoutButton
            label={`Downgrade to ${getNiTierConfig(downgradePayload.tier).name}`}
            payload={downgradePayload}
            className={secondaryButtonClass}
          />
        )}

        <Link href="/account/billing" className={billingLinkClass}>
          Billing Settings
        </Link>

        {canPause && (
          <button
            type="button"
            onClick={handlePause}
            disabled={pauseLoading}
            className={`text-sm underline-offset-2 transition hover:underline disabled:opacity-50 ${
              isReplyflow ? "text-rf-muted hover:text-rf-rose" : "text-ni-muted hover:text-cyan-300"
            }`}
          >
            {pauseLoading ? "Pausing…" : "Pause Subscription"}
          </button>
        )}
      </div>

      {pauseMessage && (
        <p className="text-sm text-emerald-300" role="status">
          {pauseMessage}
        </p>
      )}
      {pauseError && (
        <p className="text-sm text-red-300" role="alert">
          {pauseError}
        </p>
      )}
    </div>
  );

  if (billingState.isMasterAccount) {
    return (
      <MasterAccountPreview enabled>
        <div className={`text-center ${className}`}>
          <p className="text-sm text-ni-muted">{planSummary.description}</p>
          <Link href="/account/billing" className={billingLinkClass}>
            Billing Settings
          </Link>
        </div>
      </MasterAccountPreview>
    );
  }

  return actionContent;
}

interface LoggedInSubscriptionActionsFromApiProps {
  context?: SubscriptionContext;
  toolSlug?: string;
  variant?: "portal" | "replyflow" | "grantbot";
  className?: string;
}

/** Fetches billing state client-side for pages that don't have server-side state. */
export function LoggedInSubscriptionActionsFromApi({
  context = "portal",
  toolSlug,
  variant = "portal",
  className,
}: LoggedInSubscriptionActionsFromApiProps) {
  const [state, setState] = useState<{
    niTier: UserBillingState["niTier"];
    billingInterval: UserBillingState["billingInterval"];
    isMasterAccount: boolean;
    niStripeSubscriptionId: string | null;
    toolkit: UserBillingState["toolkit"];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/entitlements")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setState({
          niTier: data.niTier ?? "free",
          billingInterval: data.billingInterval ?? null,
          isMasterAccount: data.isMasterAccount ?? false,
          niStripeSubscriptionId: data.niStripeSubscriptionId ?? null,
          toolkit: data.toolkit ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setState(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-center text-sm text-ni-muted">Loading subscription…</p>;
  }

  if (!state) return null;

  return (
    <LoggedInSubscriptionActions
      billingState={state}
      context={context}
      toolSlug={toolSlug}
      variant={variant}
      className={className}
    />
  );
}
