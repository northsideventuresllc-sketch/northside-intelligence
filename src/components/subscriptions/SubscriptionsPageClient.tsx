"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import {
  ALL_NI_TIERS,
  getNiTierDetail,
  getTierPriceSummary,
} from "@/lib/billing/ni-tier-details";
import { NI_TIERS, formatNiPrice, type NiTier } from "@/lib/billing/ni-tiers";
import { buildPortalAuthUrl } from "@/lib/ni-auth";

interface SubscriptionsPageClientProps {
  initialIsLoggedIn?: boolean;
  initialNiTier?: NiTier;
}

export function SubscriptionsPageClient({
  initialIsLoggedIn = false,
  initialNiTier = "free",
}: SubscriptionsPageClientProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [niTier, setNiTier] = useState<NiTier>(initialNiTier);
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState(!initialIsLoggedIn);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/billing/entitlements").then((res) => res.json()),
    ])
      .then(([authData, billingData]) => {
        if (cancelled) return;
        setIsLoggedIn(!!authData.user);
        if (billingData.niTier) {
          setNiTier(billingData.niTier as NiTier);
        }
        if (billingData.billingInterval === "annual") {
          setAnnual(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoggedIn(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signupUrl = buildPortalAuthUrl("signup", "/subscriptions");

  return (
    <div>
      <div className="mb-12 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
          Subscriptions
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
            NI Subscription Plans
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ni-muted">
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

      {loading ? (
        <p className="text-center text-sm text-ni-muted">Loading plans…</p>
      ) : (
        <div className="space-y-6">
          {ALL_NI_TIERS.map((tier) => {
            const plan = NI_TIERS[tier];
            const detail = getNiTierDetail(tier);
            const isCurrentPlan = isLoggedIn && niTier === tier;
            const isPopular = tier === "core";
            const displayPrice =
              tier === "free"
                ? "$0"
                : annual
                  ? `$${formatNiPrice(plan.annualMonthlyUsd)}`
                  : `$${formatNiPrice(plan.monthlyPriceUsd)}`;
            const priceSuffix = tier === "free" ? "/mo" : annual ? "/mo billed annually" : "/mo";

            return (
              <article
                key={tier}
                className={`glass-panel relative overflow-hidden p-6 sm:p-8 ${
                  isCurrentPlan
                    ? "ring-2 ring-emerald-400/50"
                    : isPopular
                      ? "ring-1 ring-cyan-400/30"
                      : ""
                }`}
              >
                {isCurrentPlan && (
                  <span className="absolute right-4 top-4 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Your Current Plan
                  </span>
                )}
                {isPopular && !isCurrentPlan && (
                  <span className="absolute right-4 top-4 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    Popular
                  </span>
                )}

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="text-2xl font-semibold text-white">{plan.name}</h2>
                      <p className="text-3xl font-bold text-white">
                        {displayPrice}
                        <span className="text-sm font-normal text-ni-muted">{priceSuffix}</span>
                      </p>
                    </div>
                    {tier !== "free" && annual && (
                      <p className="mt-1 text-xs text-ni-muted">
                        ${plan.annualTotalUsd} upfront per year
                      </p>
                    )}
                    <p className="mt-2 text-sm font-medium text-cyan-200/80">{detail.headline}</p>
                    <p className="mt-1 text-sm text-ni-muted">{plan.description}</p>
                  </div>

                  <div className="lg:max-w-md lg:flex-shrink-0">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
                      What&apos;s Included
                    </p>
                    <ul className="space-y-2">
                      {detail.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-ni-muted">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400/70" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-ni-muted">
                      <span className="font-medium text-white/80">Best for:</span> {detail.idealFor}
                    </p>
                    <p className="mt-2 text-xs text-ni-muted">{getTierPriceSummary(tier, annual)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <nav
        className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 border-t border-white/10 pt-8 text-sm"
        aria-label="Subscription page actions"
      >
        <Link
          href="/"
          className="font-medium text-ni-muted transition hover:text-cyan-300"
        >
          Back To Home
        </Link>

        {isLoggedIn ? (
          <>
            <span className="text-white/20" aria-hidden>
              |
            </span>
            <SignOutButton
              label="Log Out"
              className="font-medium text-ni-muted transition hover:text-cyan-300 disabled:opacity-50"
            />
            <span className="text-white/20" aria-hidden>
              |
            </span>
            <Link
              href="/account/billing"
              className="font-medium text-ni-muted transition hover:text-cyan-300"
            >
              Change Subscription
            </Link>
          </>
        ) : (
          <>
            <span className="text-white/20" aria-hidden>
              |
            </span>
            <Link
              href={signupUrl}
              className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
