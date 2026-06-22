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
import { AddToToolCasePrompt } from "@/components/billing/AddToToolCasePrompt";

interface GrantBotPricingSectionProps {
  pricing?: ToolPricing | null;
}

export function GrantBotPricingSection({ pricing }: GrantBotPricingSectionProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [billingState, setBillingState] = useState<UserBillingState | null>(null);
  const [loading, setLoading] = useState(true);

  const fallbackPricing: ToolPricing = pricing ?? {
    toolSlug: "grantbot",
    baseMonthlyUsd: 39,
    monthlyPriceUsd: 39,
    annualPriceUsd: 390,
    lifetimePriceUsd: 819,
    demandMultiplier: 1,
    targetAudience: "Nonprofits and grant writers",
    marketTier: "premium",
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
    !!userId && shouldShowPermanentAccessOffer("grantbot", userId);

  return (
    <section id="pricing" className="border-t border-white/10 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold gb-gradient-text">Simple Pricing</h2>
        <p className="mt-2 text-center text-gb-muted">
          Start free with capped usage, or subscribe for unlimited GrantBot access.
        </p>

        {loading ? (
          <p className="mt-12 text-center text-sm text-gb-muted">Loading pricing…</p>
        ) : isLoggedIn && billingState ? (
          <div className="mx-auto mt-12 max-w-md space-y-6">
            {!billingState.ownedToolSlugs.includes("grantbot") ? (
              <AddToToolCasePrompt toolSlug="grantbot" toolName="GrantBot" variant="grantbot" />
            ) : userHasUnlimitedToolAccess(billingState, "grantbot") ? (
              <div className="gb-glass rounded-2xl p-8">
                <LoggedInSubscriptionActions
                  billingState={billingState}
                  context="tool"
                  toolSlug="grantbot"
                  variant="grantbot"
                />
              </div>
            ) : (
              <ToolSubscriptionPanel
                toolSlug="grantbot"
                toolName="GrantBot"
                pricing={fallbackPricing}
                billingState={billingState}
                showPermanentOffer={showPermanentOffer}
                variant="grantbot"
              />
            )}
          </div>
        ) : (
          <div className="mt-12">
            <ToolFreemiumPricingGrid
              toolSlug="grantbot"
              toolName="GrantBot"
              pricing={fallbackPricing}
              isLoggedIn={false}
              returnPath="/grantbot"
              variant="grantbot"
            />
          </div>
        )}

        {!isLoggedIn && !loading && (
          <p className="mt-8 text-center text-sm text-gb-muted">
            Already have an account?{" "}
            <Link href="/auth/signin?returnTo=/grantbot" className="text-gb-emerald hover:underline">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
