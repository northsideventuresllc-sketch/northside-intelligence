"use client";

import { CheckoutButton } from "@/components/billing/CheckoutButton";
import type { UserBillingState } from "@/lib/billing/entitlements";
import { userHasUnlimitedToolAccess } from "@/lib/billing/entitlements";
import type { ToolPricing } from "@/lib/billing/tool-pricing";

interface ToolSubscriptionPanelProps {
  toolSlug: string;
  toolName: string;
  pricing: ToolPricing;
  billingState: UserBillingState;
  showPermanentOffer: boolean;
  variant?: "portal" | "replyflow";
}

export function ToolSubscriptionPanel({
  toolSlug,
  toolName,
  pricing,
  billingState,
  showPermanentOffer,
  variant = "portal",
}: ToolSubscriptionPanelProps) {
  const isReplyflow = variant === "replyflow";
  const hasUnlimited = userHasUnlimitedToolAccess(billingState, toolSlug);
  const mutedClass = isReplyflow ? "text-rf-muted" : "text-ni-muted";
  const cardClass = isReplyflow ? "rf-glass rounded-2xl p-6" : "glass-panel p-6";
  const buttonClass = isReplyflow
    ? "w-full rounded-2xl bg-gradient-to-r from-rf-rose via-rf-coral to-rf-violet py-3 text-sm font-semibold text-white shadow-rf-glow transition hover:opacity-95 disabled:opacity-50"
    : "w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50";

  if (hasUnlimited) {
    return (
      <div className={`${cardClass} text-center`}>
        <p className={`text-sm ${mutedClass}`}>You have unlimited access to {toolName}.</p>
      </div>
    );
  }

  return (
    <div className={`${cardClass} space-y-4`}>
      <div className="text-center">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedClass}`}>
          Unlimited Access
        </p>
        <p className="mt-2 text-3xl font-bold text-white">
          ${pricing.monthlyPriceUsd.toFixed(2)}
          <span className={`text-sm font-normal ${mutedClass}`}>/mo</span>
        </p>
        <p className={`mt-2 text-sm ${mutedClass}`}>
          Subscribe for unlimited use of {toolName}.
        </p>
      </div>

      <CheckoutButton
        label="Subscribe Monthly"
        payload={{ type: "tool_subscription", toolSlug, interval: "monthly" }}
        className={buttonClass}
      />

      {showPermanentOffer && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            Limited-Time Offer
          </p>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            Permanent unlimited access to {toolName} — available for a short window.
          </p>
          <div className="mt-3">
            <CheckoutButton
              label="Buy Permanent Access"
              payload={{ type: "tool_lifetime", toolSlug }}
              className={
                isReplyflow
                  ? "w-full rounded-xl border border-amber-400/40 bg-amber-500/20 py-2.5 text-sm font-semibold text-amber-200"
                  : "w-full rounded-xl border border-amber-400/40 bg-amber-500/20 py-2.5 text-sm font-semibold text-amber-200"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
