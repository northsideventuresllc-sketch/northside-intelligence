"use client";

import { useEffect, useState } from "react";
import { LoggedInSubscriptionActions } from "@/components/billing/LoggedInSubscriptionActions";
import { NiPricingGrid } from "@/components/billing/NiPricingGrid";
import type { UserBillingState } from "@/lib/billing/entitlements";
import type { NiTier } from "@/lib/billing/ni-tiers";

export function PricingSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billingState, setBillingState] = useState<Pick<
    UserBillingState,
    "niTier" | "billingInterval" | "isMasterAccount" | "niStripeSubscriptionId" | "toolkit"
  > | null>(null);
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/billing/entitlements").then((res) => res.json()),
    ])
      .then(([authData, billingData]) => {
        if (cancelled) return;
        setIsLoggedIn(!!authData.user);
        setBillingState({
          niTier: (billingData.niTier as NiTier) ?? "free",
          billingInterval: billingData.billingInterval ?? null,
          isMasterAccount: billingData.isMasterAccount ?? false,
          niStripeSubscriptionId: billingData.niStripeSubscriptionId ?? null,
          toolkit: billingData.toolkit ?? [],
        });
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

  return (
    <section id="pricing" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cyan-500/[0.04] via-transparent to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Pricing
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
              NI Subscriptions
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
            Pick your plan for unlimited usage across Intelligence Tools. Free tier users can also
            purchase individual tools à la carte.
          </p>

          {!isLoggedIn && (
            <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
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
          )}
        </div>

        {loading ? (
          <p className="text-center text-sm text-ni-muted">Loading pricing…</p>
        ) : isLoggedIn && billingState ? (
          <div className="glass-panel mx-auto max-w-md p-8">
            <LoggedInSubscriptionActions billingState={billingState} context="portal" />
          </div>
        ) : (
          <NiPricingGrid annual={annual} />
        )}
      </div>
    </section>
  );
}
