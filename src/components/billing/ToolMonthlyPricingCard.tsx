import Link from "next/link";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import type { ToolPricing } from "@/lib/billing/tool-pricing";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";

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
  const freeTier = getSector3FreeTierSpec(toolSlug);
  const signupHref = `/auth/signup?returnTo=${encodeURIComponent(returnPath)}`;
  const isReplyflow = variant === "replyflow";
  const isGrantbot = variant === "grantbot";

  const cardClass = isReplyflow
    ? "rf-glass relative rounded-2xl p-8 text-center ring-2 ring-rf-rose/40 shadow-rf-glow"
    : isGrantbot
      ? "gb-glass relative rounded-2xl p-8 text-center ring-2 ring-gb-emerald/40 shadow-gb-glow"
      : "glass-panel relative p-8 text-center ring-1 ring-cyan-400/40";

  const priceClass = "text-4xl font-bold text-white";
  const mutedClass = isReplyflow ? "text-rf-muted" : isGrantbot ? "text-gb-muted" : "text-ni-muted";
  const accentClass = isReplyflow
    ? "text-rf-rose"
    : isGrantbot
      ? "text-gb-emerald"
      : "text-cyan-300";
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

  const paidFeatures = [
    `Unlimited ${freeTier.unit}`,
    "No monthly usage cap",
    "Cancel anytime",
  ];

  return (
    <div className={cardClass}>
      <span
        className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold text-white ${
          isReplyflow
            ? "bg-rf-rose"
            : isGrantbot
              ? "bg-gb-emerald text-gb-bg"
              : "border border-cyan-400/40 bg-cyan-500/20 text-cyan-300"
        }`}
      >
        Popular
      </span>
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedClass}`}>
        Unlimited
      </p>
      <p className={`mt-4 ${priceClass}`}>
        ${pricing.monthlyPriceUsd.toFixed(2)}
        <span className={`text-base font-normal ${mutedClass}`}>/mo</span>
      </p>
      <p className="mt-1 font-semibold text-white">Unlimited Access</p>
      <p className={`mt-2 text-sm ${mutedClass}`}>
        Full {toolName} access with one monthly subscription.
      </p>

      <ul className={`mt-5 space-y-2 text-left text-sm ${mutedClass}`}>
        {paidFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className={`mt-0.5 ${accentClass}`}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

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
