import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import type { ToolPricing } from "@/lib/billing/tool-pricing";

interface ToolMonthlyPricingCardProps {
  toolSlug: string;
  toolName: string;
  pricing: ToolPricing;
  isLoggedIn: boolean;
  returnPath: string;
  variant?: "portal" | "replyflow" | "grantbot";
}

export function ToolMonthlyPricingCard({
  toolSlug,
  toolName,
  pricing,
  isLoggedIn,
  returnPath,
  variant = "portal",
}: ToolMonthlyPricingCardProps) {
  const signupHref = `/auth/signup?returnTo=${encodeURIComponent(returnPath)}`;
  const isReplyflow = variant === "replyflow";
  const isGrantbot = variant === "grantbot";

  const cardClass = isReplyflow
    ? "rf-glass mx-auto max-w-sm rounded-2xl p-8 text-center"
    : isGrantbot
      ? "gb-glass mx-auto max-w-sm rounded-2xl p-8 text-center"
      : "glass-panel mx-auto max-w-sm p-8 text-center";

  const priceClass = isReplyflow ? "text-4xl font-bold text-white" : "text-4xl font-bold text-white";
  const mutedClass = isReplyflow ? "text-rf-muted" : isGrantbot ? "text-gb-muted" : "text-ni-muted";
  const buttonClass = isReplyflow
    ? "mt-6 block w-full rounded-2xl bg-gradient-to-r from-rf-rose via-rf-coral to-rf-violet py-3.5 text-sm font-semibold text-white shadow-rf-glow transition hover:opacity-95"
    : isGrantbot
      ? "mt-6 block w-full rounded-2xl bg-gradient-to-r from-gb-emerald to-gb-amber py-3.5 text-sm font-semibold text-gb-bg shadow-gb-glow transition hover:opacity-95"
      : "mt-6 block w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20";

  const signupButtonClass = isReplyflow
    ? "mt-6 block w-full rounded-2xl border border-white/20 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
    : isGrantbot
      ? "mt-6 block w-full rounded-2xl border border-gb-emerald/30 py-3.5 text-sm font-semibold text-white transition hover:bg-gb-emerald/10"
      : buttonClass;

  return (
    <div className={cardClass}>
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedClass}`}>
        Unlimited Access
      </p>
      <p className={`mt-4 ${priceClass}`}>
        ${pricing.monthlyPriceUsd.toFixed(2)}
        <span className={`text-base font-normal ${mutedClass}`}>/mo</span>
      </p>
      <p className={`mt-2 text-sm ${mutedClass}`}>
        Unlimited use of {toolName} with one monthly subscription.
      </p>
      {isLoggedIn ? (
        <div className="mt-6">
          <CheckoutButton
            label="Subscribe Monthly"
            payload={{ type: "tool_subscription", toolSlug, interval: "monthly" }}
            className={buttonClass}
          />
        </div>
      ) : (
        <Link href={signupHref} className={signupButtonClass}>
          Sign Up to Subscribe
        </Link>
      )}
    </div>
  );
}
