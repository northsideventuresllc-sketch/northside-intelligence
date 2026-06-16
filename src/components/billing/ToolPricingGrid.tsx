import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import type { ToolPricing } from "@/lib/billing/tool-pricing";

interface ToolPricingGridProps {
  toolSlug: string;
  toolName: string;
  pricing: ToolPricing;
  lifetimeActive: boolean;
  lifetimeReason?: string;
  isLoggedIn: boolean;
  returnPath: string;
}

export function ToolPricingGrid({
  toolSlug,
  toolName,
  pricing,
  lifetimeActive,
  lifetimeReason,
  isLoggedIn,
  returnPath,
}: ToolPricingGridProps) {
  const signupHref = `/auth/signup?returnTo=${encodeURIComponent(returnPath)}`;

  return (
    <div className="space-y-4">
      <h2 className="text-center text-lg font-semibold text-white">Get Unlimited Access</h2>
      <p className="text-center text-xs text-ni-muted">
        Market-adjusted subscription for {pricing.targetAudience.toLowerCase()} · Demand multiplier{" "}
        {pricing.demandMultiplier.toFixed(2)}×
      </p>

      <div className={`grid gap-4 ${lifetimeActive ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <div className="glass-panel p-5 text-center">
          <p className="text-2xl font-bold text-white">
            ${pricing.monthlyPriceUsd.toFixed(0)}
            <span className="text-sm font-normal text-ni-muted">/mo</span>
          </p>
          <p className="mt-1 text-sm text-ni-muted">Monthly</p>
          {isLoggedIn ? (
            <div className="mt-4">
              <CheckoutButton
                label="Subscribe Monthly"
                payload={{ type: "tool_subscription", toolSlug, interval: "monthly" }}
              />
            </div>
          ) : (
            <Link
              href={signupHref}
              className="mt-4 block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300"
            >
              Sign Up to Subscribe
            </Link>
          )}
        </div>

        <div className="glass-panel p-5 text-center ring-1 ring-cyan-400/30">
          <p className="text-2xl font-bold text-white">
            ${pricing.annualPriceUsd.toFixed(0)}
            <span className="text-sm font-normal text-ni-muted">/yr</span>
          </p>
          <p className="mt-1 text-sm text-ni-muted">Annual</p>
          {isLoggedIn ? (
            <div className="mt-4">
              <CheckoutButton
                label="Subscribe Annually"
                payload={{ type: "tool_subscription", toolSlug, interval: "annual" }}
              />
            </div>
          ) : (
            <Link
              href={signupHref}
              className="mt-4 block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300"
            >
              Sign Up to Subscribe
            </Link>
          )}
        </div>

        {lifetimeActive && (
          <div className="glass-panel p-5 text-center">
            <p className="text-2xl font-bold text-white">${pricing.lifetimePriceUsd.toFixed(0)}</p>
            <p className="mt-1 text-sm text-ni-muted">Lifetime</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-300/80">
              Launch Week Only
            </p>
            {isLoggedIn ? (
              <div className="mt-4">
                <CheckoutButton
                  label="Buy Lifetime"
                  payload={{ type: "tool_lifetime", toolSlug }}
                />
              </div>
            ) : (
              <Link
                href={signupHref}
                className="mt-4 block rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300"
              >
                Sign Up to Purchase
              </Link>
            )}
          </div>
        )}
      </div>

      {!lifetimeActive && lifetimeReason && (
        <div className="glass-panel mt-4 p-4 text-center">
          <p className="text-sm font-semibold text-white/90">Lifetime Access</p>
          <p className="mt-1 text-xs text-ni-muted">{lifetimeReason}</p>
        </div>
      )}

      <p className="text-center text-xs text-ni-muted">
        Lifetime pricing adjusts with market demand. Or{" "}
        <a href="/#pricing" className="text-cyan-300 hover:text-cyan-200">
          upgrade your NI plan
        </a>{" "}
        for bundled unlimited access to {toolName}.
      </p>
    </div>
  );
}
