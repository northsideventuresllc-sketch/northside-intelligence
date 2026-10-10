"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoggedInSubscriptionActions } from "@/components/billing/LoggedInSubscriptionActions";
import type { UserBillingState } from "@/lib/billing/entitlements";
import { userHasUnlimitedToolAccess } from "@/lib/billing/entitlements";
import { REPLYFLOW_TIERS } from "@/lib/replyflow/tier";
import { ToolFreePricingCard } from "@/components/billing/ToolFreePricingCard";
import { AgenticTierComingSoonCard } from "@/components/billing/AgenticTierComingSoonCard";

interface ReplyFlowPricingSectionProps {
  showTitle?: boolean;
}

export function ReplyFlowPricingSection({ showTitle = true }: ReplyFlowPricingSectionProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billingState, setBillingState] = useState<UserBillingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOutPlan, setCheckingOutPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/billing/entitlements").then((res) => res.json()),
    ])
      .then(([authData, billingData]) => {
        if (cancelled) return;
        setIsLoggedIn(!!authData.user);
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

  async function handleCheckout(plan: "core" | "done_with_you") {
    setCheckoutError("");
    setCheckingOutPlan(plan);
    try {
      const res = await fetch("/api/replyflow/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setCheckoutError(data.error ?? "Checkout unavailable. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Network error. Please try again.");
    } finally {
      setCheckingOutPlan(null);
    }
  }

  const hasUnlimited = billingState && userHasUnlimitedToolAccess(billingState, "replyflow");

  return (
    <section id="pricing" className="border-t border-white/10 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {showTitle && (
          <div className="text-center">
            <span className="inline-block rounded-full border border-rf-rose/30 bg-rf-rose/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-rf-rose">
              Pricing & Tiers
            </span>
            <h2 className="mt-3 text-3xl font-bold rf-gradient-text sm:text-4xl">
              Predictable, High-Impact Pricing
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-rf-muted">
              Start free with capped usage, or subscribe for unlimited access.
            </p>
          </div>
        )}

        {checkoutError && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {checkoutError}
          </div>
        )}

        {loading ? (
          <p className="mt-12 text-center text-sm text-rf-muted">Loading pricing…</p>
        ) : hasUnlimited && billingState ? (
          <div className="mx-auto mt-12 max-w-md space-y-6">
            <div className="rf-glass rounded-2xl p-8">
              <h3 className="mb-2 text-center text-lg font-bold text-white">Active Subscription</h3>
              <p className="mb-6 text-center text-sm text-rf-muted">
                You have unlimited access to ReplyFlow.
              </p>
              <LoggedInSubscriptionActions
                billingState={billingState}
                context="tool"
                toolSlug="replyflow"
                variant="replyflow"
              />
            </div>
            <AgenticTierComingSoonCard
              toolSlug="replyflow"
              toolName="ReplyFlow"
              variant="replyflow"
            />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            
            {/* Starter Access */}
            <ToolFreePricingCard
              toolSlug="replyflow"
              toolName="ReplyFlow"
              isLoggedIn={isLoggedIn}
              returnPath="/replyflow"
              variant="replyflow"
            />
            
            {/* Core Tier */}
            <div className="rf-glass flex flex-col justify-between rounded-3xl border border-white/10 p-6 shadow-rf-violet transition hover:border-white/20">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{REPLYFLOW_TIERS.core.name}</h3>
                </div>
                <p className="mt-2 text-xs text-rf-muted">{REPLYFLOW_TIERS.core.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-white">
                    ${REPLYFLOW_TIERS.core.priceMonthlyUsd}
                  </span>
                  <span className="text-xs font-medium text-rf-muted">/month</span>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-rf-muted">
                  {REPLYFLOW_TIERS.core.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 text-rf-rose">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => handleCheckout("core")}
                    disabled={checkingOutPlan !== null}
                    className="w-full rounded-xl border border-rf-rose/40 bg-rf-rose/15 py-3 text-xs font-semibold text-white transition hover:bg-rf-rose/25 disabled:opacity-50"
                  >
                    {checkingOutPlan === "core" ? "Preparing Checkout…" : "Subscribe to SaaS Access ($15/mo)"}
                  </button>
                ) : (
                  <Link
                    href="/auth/signup?returnTo=/replyflow"
                    className="block w-full rounded-xl border border-rf-rose/40 bg-rf-rose/15 py-3 text-center text-xs font-semibold text-white transition hover:bg-rf-rose/25"
                  >
                    Get Started with SaaS Access
                  </Link>
                )}
              </div>
            </div>

            {/* Agentic Tier Coming Soon (Strictly No Prices) */}
            <AgenticTierComingSoonCard
              toolSlug="replyflow"
              toolName="ReplyFlow"
              variant="replyflow"
            />
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-rf-muted">
            Notice: Public free tier has been retired for cold signups. Existing grandfathered accounts retain current terms.
          </p>
          {!isLoggedIn && !loading && (
            <p className="mt-4 text-sm text-rf-muted">
              Already have an account?{" "}
              <Link href="/auth/signin?returnTo=/replyflow" className="text-rf-rose hover:underline">
                Sign In
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
