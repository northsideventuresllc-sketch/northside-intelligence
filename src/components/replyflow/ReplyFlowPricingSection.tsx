"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoggedInSubscriptionActions } from "@/components/billing/LoggedInSubscriptionActions";
import type { UserBillingState } from "@/lib/billing/entitlements";
import { userHasUnlimitedToolAccess } from "@/lib/billing/entitlements";
import { REPLYFLOW_TIERS } from "@/lib/replyflow/tier";

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
              Retiring public free tier for cold signups. Choose self-serve Core or hands-on Done-With-You to automate customer replies with dedicated onboarding.
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
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Core Tier */}
            <div className="rf-glass flex flex-col justify-between rounded-3xl border border-white/10 p-6 shadow-rf-violet transition hover:border-white/20">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{REPLYFLOW_TIERS.core.name}</h3>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-rf-muted">
                    +$500 setup
                  </span>
                </div>
                <p className="mt-2 text-xs text-rf-muted">{REPLYFLOW_TIERS.core.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-white">
                    ${REPLYFLOW_TIERS.core.priceMonthlyUsd}
                  </span>
                  <span className="text-xs font-medium text-rf-muted">/month</span>
                  <p className="mt-1 text-[11px] text-rf-muted/80">
                    +$500 one-time onboarding fee
                  </p>
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
                    {checkingOutPlan === "core" ? "Preparing Checkout…" : "Subscribe to Core ($149/mo)"}
                  </button>
                ) : (
                  <Link
                    href="/auth/signup?returnTo=/replyflow"
                    className="block w-full rounded-xl border border-rf-rose/40 bg-rf-rose/15 py-3 text-center text-xs font-semibold text-white transition hover:bg-rf-rose/25"
                  >
                    Get Started with Core
                  </Link>
                )}
              </div>
            </div>

            {/* Done-With-You Tier */}
            <div className="rf-glass relative flex flex-col justify-between rounded-3xl border border-white/15 p-6 shadow-rf-glow transition hover:border-white/30">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{REPLYFLOW_TIERS.done_with_you.name}</h3>
                  <span className="rounded-full border border-rf-rose/40 bg-rf-rose/10 px-2.5 py-0.5 text-[10px] font-medium text-rf-rose">
                    +$500 setup
                  </span>
                </div>
                <p className="mt-2 text-xs text-rf-muted">{REPLYFLOW_TIERS.done_with_you.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-white">
                    ${REPLYFLOW_TIERS.done_with_you.priceMonthlyUsd}
                  </span>
                  <span className="text-xs font-medium text-rf-muted">/month</span>
                  <p className="mt-1 text-[11px] text-rf-rose/90">
                    +$500 guided implementation
                  </p>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-rf-muted">
                  {REPLYFLOW_TIERS.done_with_you.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 text-rf-rose">✓</span>
                      <span className={feature.startsWith("Everything") ? "font-medium text-white" : ""}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => handleCheckout("done_with_you")}
                    disabled={checkingOutPlan !== null}
                    className="w-full rounded-xl border border-rf-rose/40 bg-white/10 py-3 text-xs font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
                  >
                    {checkingOutPlan === "done_with_you" ? "Preparing Checkout…" : "Subscribe ($299/mo)"}
                  </button>
                ) : (
                  <Link
                    href="/auth/signup?returnTo=/replyflow"
                    className="block w-full rounded-xl border border-rf-rose/40 bg-white/10 py-3 text-center text-xs font-semibold text-white transition hover:bg-white/15"
                  >
                    Get Started with DWY
                  </Link>
                )}
              </div>
            </div>

            {/* Agentic Headless Tier (Featured) */}
            <div className="rf-glass relative flex flex-col justify-between rounded-3xl border-2 border-rf-rose/60 p-6 shadow-rf-glow transition hover:border-rf-rose">
              <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-rf-rose to-rf-coral px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-rf-glow">
                Most Powerful
              </span>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                    <span>⚡ Agentic Tier</span>
                  </h3>
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                    24/7 Worker
                  </span>
                </div>
                <p className="mt-2 text-xs text-rf-muted">Autonomous headless triage worker + custom MCPs.</p>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-white">$349</span>
                  <span className="text-xs font-medium text-rf-muted">/month</span>
                  <p className="mt-1 text-[11px] text-cyan-300">
                    Dedicated Agent Key + FastMCP tools
                  </p>
                </div>
                <ul className="mt-5 space-y-2.5 text-xs text-rf-muted">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400">✓</span>
                    <span>Everything in Core SaaS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400">✓</span>
                    <span>Dedicated Agent API Key (<code className="text-cyan-300">ni_agt_...</code>)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400">✓</span>
                    <span>Gmail & Zendesk headless auto-drafting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400">✓</span>
                    <span>FastMCP schema for Claude & Antigravity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-cyan-400">✓</span>
                    <span>Passive edit-diff learning engine sync</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6">
                <Link
                  href="/auth/signup?returnTo=/replyflow/settings"
                  className="block w-full rounded-xl bg-gradient-to-r from-rf-rose via-rf-coral to-rf-violet py-3 text-center text-xs font-bold text-white shadow-rf-glow transition hover:opacity-95"
                >
                  Deploy Agentic Tier ($349/mo)
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-rf-muted">
            Notice: Public free tier has been retired for cold signups. Existing grandfathered accounts retain current terms. All plans include $500 initial setup.
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
