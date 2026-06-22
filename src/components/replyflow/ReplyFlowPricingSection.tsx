"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoggedInSubscriptionActions } from "@/components/billing/LoggedInSubscriptionActions";
import { ToolFreemiumPricingGrid } from "@/components/billing/ToolFreemiumPricingGrid";
import { ToolSubscriptionPanel } from "@/components/billing/ToolSubscriptionPanel";
import type { UserBillingState } from "@/lib/billing/entitlements";
import { userHasUnlimitedToolAccess } from "@/lib/billing/entitlements";
import { shouldShowPermanentAccessOffer } from "@/lib/billing/permanent-access-offer";
import type { ToolPricing } from "@/lib/billing/tool-pricing";
import type { NiTier } from "@/lib/billing/ni-tiers";
import { AddToToolCasePrompt } from "@/components/billing/AddToToolCasePrompt";

interface ReplyFlowPricingSectionProps {
  pricing?: ToolPricing | null;
}

export function ReplyFlowPricingSection({ pricing }: ReplyFlowPricingSectionProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [billingState, setBillingState] = useState<UserBillingState | null>(null);
  const [loading, setLoading] = useState(true);

  const fallbackPricing: ToolPricing = pricing ?? {
    toolSlug: "replyflow",
    baseMonthlyUsd: 15,
    monthlyPriceUsd: 15,
    annualPriceUsd: 150,
    lifetimePriceUsd: 315,
    demandMultiplier: 1,
    targetAudience: "Customer support teams",
    marketTier: "entry",
    stripeMonthlyPriceId: null,
    stripeAnnualPriceId: null,
    stripeLifetimePriceId: null,
  };

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/billing/entitlements").then((res) => res.json()),
    ])
      .then(([authData, billingData]) => {
        if (cancelled) return;
        setIsLoggedIn(!!authData.user);
        setUserId(authData.user?.id ?? null);
        if (authData.user) {
          setBillingState(billingData as UserBillingState);
        } else {
          setBillingState(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoggedIn(false);
          setBillingState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const showPermanentOffer =
    !!userId && shouldShowPermanentAccessOffer("replyflow", userId);

  return (
    <section id="pricing" className="border-t border-white/10 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold rf-gradient-text">Simple Pricing</h2>
        <p className="mt-2 text-center text-rf-muted">
          Start free with capped usage, or subscribe for unlimited ReplyFlow access.
        </p>

        {loading ? (
          <p className="mt-12 text-center text-sm text-rf-muted">Loading pricing…</p>
        ) : isLoggedIn && billingState ? (
          <div className="mx-auto mt-12 max-w-md space-y-6">
            {!billingState.ownedToolSlugs.includes("replyflow") ? (
              <AddToToolCasePrompt toolSlug="replyflow" toolName="ReplyFlow" variant="replyflow" />
            ) : userHasUnlimitedToolAccess(billingState, "replyflow") ? (
              <div className="rf-glass rounded-2xl p-8">
                <LoggedInSubscriptionActions
                  billingState={billingState}
                  context="tool"
                  toolSlug="replyflow"
                  variant="replyflow"
                />
              </div>
            ) : (
              <ToolSubscriptionPanel
                toolSlug="replyflow"
                toolName="ReplyFlow"
                pricing={fallbackPricing}
                billingState={billingState}
                showPermanentOffer={showPermanentOffer}
                variant="replyflow"
              />
            )}
          </div>
        ) : (
          <div className="mt-12">
            <ToolFreemiumPricingGrid
              toolSlug="replyflow"
              toolName="ReplyFlow"
              pricing={fallbackPricing}
              isLoggedIn={false}
              returnPath="/replyflow"
              variant="replyflow"
            />
          </div>
        )}

        {!isLoggedIn && !loading && (
          <p className="mt-8 text-center text-sm text-rf-muted">
            Already have an account?{" "}
            <Link href="/auth/signin?returnTo=/replyflow" className="text-rf-rose hover:underline">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
