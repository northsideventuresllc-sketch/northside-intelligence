"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { NI_TIERS, PAID_NI_TIERS, formatNiPrice, type NiTier } from "@/lib/billing/ni-tiers";
import { buildPortalAuthUrl } from "@/lib/ni-auth";

export function PricingSection() {
  const signupUrl = buildPortalAuthUrl("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [niTier, setNiTier] = useState<NiTier>("free");
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: unknown }) => {
        if (!cancelled) setIsLoggedIn(!!data.user);
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });

    fetch("/api/billing/entitlements")
      .then((res) => res.json())
      .then((data: { niTier?: NiTier }) => {
        if (!cancelled && data.niTier) setNiTier(data.niTier);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const tiers = ["free", ...PAID_NI_TIERS] as NiTier[];

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
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => {
            const plan = NI_TIERS[tier];
            const isPopular = tier === "core";
            const isCurrent = niTier === tier;
            const displayPrice =
              tier === "free"
                ? "$0"
                : annual
                  ? `$${formatNiPrice(plan.annualMonthlyUsd)}`
                  : `$${formatNiPrice(plan.monthlyPriceUsd)}`;
            const priceSuffix =
              tier === "free" ? "/mo" : annual ? "/mo billed annually" : "/mo";

            return (
              <div
                key={tier}
                className={`glass-panel relative bg-gradient-to-br from-cyan-500/10 to-transparent p-6 ${
                  isPopular ? "ring-1 ring-cyan-400/40" : ""
                } ${isCurrent ? "ring-1 ring-emerald-400/40" : ""}`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-3 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Current
                  </span>
                )}
                <p className="text-3xl font-bold text-white">
                  {displayPrice}
                  <span className="text-sm font-normal text-ni-muted">{priceSuffix}</span>
                </p>
                {tier !== "free" && annual && (
                  <p className="mt-1 text-xs text-ni-muted">
                    ${plan.annualTotalUsd} upfront per year
                  </p>
                )}
                <p className="mt-1 font-semibold text-white">{plan.name}</p>
                <p className="mt-2 text-sm text-ni-muted">{plan.description}</p>

                <div className="mt-6">
                  {tier === "free" ? (
                    <Link
                      href={signupUrl}
                      className="block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-center text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
                    >
                      Get Started
                    </Link>
                  ) : isLoggedIn && niTier !== tier ? (
                    <CheckoutButton
                      label={isCurrent ? "Current Plan" : "Upgrade"}
                      disabled={isCurrent}
                      payload={{
                        type: "ni_subscription",
                        tier,
                        interval: annual ? "annual" : "monthly",
                      }}
                    />
                  ) : isLoggedIn ? (
                    <Link
                      href="/toolkit"
                      className="block rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-sm font-medium text-white/90 transition hover:bg-white/10"
                    >
                      Open Toolkit
                    </Link>
                  ) : (
                    <Link
                      href={signupUrl}
                      className="block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-center text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
                    >
                      Sign Up
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
