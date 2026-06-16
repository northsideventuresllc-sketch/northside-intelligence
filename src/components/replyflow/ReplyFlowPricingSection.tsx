"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoggedInSubscriptionActions } from "@/components/billing/LoggedInSubscriptionActions";
import type { UserBillingState } from "@/lib/billing/entitlements";
import type { NiTier } from "@/lib/billing/ni-tiers";
import { portalSignUpUrl } from "@/lib/replyflow/auth";

const plans = [
  { name: "Solo", price: "$9", desc: "100 replies / month", accent: "from-rf-rose/20 to-rf-coral/10" },
  {
    name: "Team",
    price: "$49",
    desc: "1,000 replies / month",
    accent: "from-rf-violet/30 to-rf-rose/10",
    popular: true,
  },
  { name: "Agency", price: "$99", desc: "Unlimited scale", accent: "from-rf-coral/20 to-rf-violet/20" },
];

export function ReplyFlowPricingSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [billingState, setBillingState] = useState<Pick<
    UserBillingState,
    "niTier" | "billingInterval" | "isMasterAccount" | "niStripeSubscriptionId" | "toolkit"
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const signupUrl = portalSignUpUrl();

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
    <section id="pricing" className="border-t border-white/10 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold rf-gradient-text">Simple Pricing</h2>
        <p className="mt-2 text-center text-rf-muted">
          One Northside Intelligence account. Upgrade when you&apos;re ready.
        </p>

        {loading ? (
          <p className="mt-12 text-center text-sm text-rf-muted">Loading pricing…</p>
        ) : isLoggedIn && billingState ? (
          <div className="rf-glass mx-auto mt-12 max-w-md rounded-2xl p-8">
            <LoggedInSubscriptionActions
              billingState={billingState}
              context="tool"
              toolSlug="replyflow"
              variant="replyflow"
            />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rf-glass relative rounded-2xl bg-gradient-to-br ${p.accent} p-6 ${
                  p.popular ? "ring-2 ring-rf-rose/50 shadow-rf-glow" : ""
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rf-rose px-3 py-0.5 text-xs font-bold text-white">
                    Popular
                  </span>
                )}
                <p className="text-3xl font-bold text-white">
                  {p.price}
                  <span className="text-sm font-normal text-rf-muted">/mo</span>
                </p>
                <p className="mt-1 font-semibold text-white">{p.name}</p>
                <p className="mt-2 text-sm text-rf-muted">{p.desc}</p>
                <a
                  href={signupUrl}
                  className="mt-6 block rounded-xl border border-white/20 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Get Started
                </a>
              </div>
            ))}
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
