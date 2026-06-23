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
import { getSector3ToolProfile } from "@/lib/billing/sector3-tool-pricing";
import type { Sector3ToolRuntimeConfig } from "@/lib/sector3-tools/types";

interface Props {
  config: Sector3ToolRuntimeConfig;
  pricing?: ToolPricing | null;
}

export function Sector3ToolPricingSection({ config, pricing }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [billingState, setBillingState] = useState<UserBillingState | null>(null);
  const [loading, setLoading] = useState(true);

  const catalog = getSector3ToolProfile(config.slug);
  const fallbackPricing: ToolPricing = pricing ?? {
    toolSlug: config.slug,
    baseMonthlyUsd: catalog?.baseMonthlyUsd ?? 20,
    monthlyPriceUsd: catalog?.baseMonthlyUsd ?? 20,
    annualPriceUsd: (catalog?.baseMonthlyUsd ?? 20) * 10,
    lifetimePriceUsd: (catalog?.baseMonthlyUsd ?? 20) * 21,
    demandMultiplier: 1,
    targetAudience: catalog?.targetAudience ?? "",
    marketTier: catalog?.marketTier ?? "growth",
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
        setBillingState(authData.user ? (billingData as UserBillingState) : null);
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
    !!userId && shouldShowPermanentAccessOffer(config.slug, userId);

  return (
    <section id="pricing" className="border-t border-white/10 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold text-white">Simple Pricing</h2>
        <p className="mt-2 text-center text-white/60">
          Start free with capped usage, or subscribe for unlimited {config.displayName} access.
        </p>

        {loading ? (
          <p className="mt-12 text-center text-sm text-white/50">Loading pricing…</p>
        ) : isLoggedIn && billingState ? (
          <div className="mx-auto mt-12 max-w-md space-y-6">
            {!billingState.ownedToolSlugs.includes(config.slug) ? (
              <AddToToolCasePrompt
                toolSlug={config.slug}
                toolName={config.displayName}
                variant="portal"
              />
            ) : userHasUnlimitedToolAccess(billingState, config.slug) ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <LoggedInSubscriptionActions
                  billingState={billingState}
                  context="tool"
                  toolSlug={config.slug}
                  variant="portal"
                />
              </div>
            ) : (
              <ToolSubscriptionPanel
                toolSlug={config.slug}
                toolName={config.displayName}
                pricing={fallbackPricing}
                billingState={billingState}
                showPermanentOffer={showPermanentOffer}
                variant="portal"
              />
            )}
          </div>
        ) : (
          <div className="mt-12">
            <ToolFreemiumPricingGrid
              toolSlug={config.slug}
              toolName={config.displayName}
              pricing={fallbackPricing}
              isLoggedIn={false}
              returnPath={config.basePath}
              variant="portal"
            />
          </div>
        )}

        {!isLoggedIn && !loading && (
          <p className="mt-8 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href={`/auth/signin?returnTo=${config.basePath}`}
              className="text-sky-400 hover:underline"
            >
              Sign In
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
