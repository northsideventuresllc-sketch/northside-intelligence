import Link from "next/link";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";

interface ToolFreePricingCardProps {
  toolSlug: string;
  toolName: string;
  isLoggedIn: boolean;
  returnPath: string;
  variant?: "portal" | "replyflow" | "grantbot";
}

export function ToolFreePricingCard({
  toolSlug,
  toolName,
  isLoggedIn,
  returnPath,
  variant = "portal",
}: ToolFreePricingCardProps) {
  const freeTier = getSector3FreeTierSpec(toolSlug);
  const signupHref = `/auth/signup?returnTo=${encodeURIComponent(returnPath)}`;
  const isReplyflow = variant === "replyflow";
  const isGrantbot = variant === "grantbot";

  const cardClass = isReplyflow
    ? "rf-glass rounded-2xl p-8 text-center"
    : isGrantbot
      ? "gb-glass rounded-2xl p-8 text-center"
      : "glass-panel p-8 text-center";

  const mutedClass = isReplyflow ? "text-rf-muted" : isGrantbot ? "text-gb-muted" : "text-ni-muted";
  const accentClass = isReplyflow
    ? "text-rf-rose"
    : isGrantbot
      ? "text-gb-emerald"
      : "text-cyan-300";
  const buttonClass = isReplyflow
    ? "mt-6 block w-full rounded-2xl border border-white/20 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
    : isGrantbot
      ? "mt-6 block w-full rounded-2xl border border-gb-emerald/30 py-3.5 text-sm font-semibold text-white transition hover:bg-gb-emerald/10"
      : "mt-6 block w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20";

  const ctaHref = isLoggedIn ? "/toolkit" : signupHref;
  const ctaLabel = isLoggedIn ? "Add to Toolkit" : "Start Free";

  return (
    <div className={cardClass}>
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedClass}`}>Free</p>
      <p className="mt-4 text-4xl font-bold text-white">
        $0
        <span className={`text-base font-normal ${mutedClass}`}>/mo</span>
      </p>
      <p className="mt-1 font-semibold text-white">Starter Access</p>
      <p className={`mt-2 text-sm ${mutedClass}`}>
        Try {toolName} with a monthly usage cap before upgrading.
      </p>

      <ul className={`mt-5 space-y-2 text-left text-sm ${mutedClass}`}>
        <li className="flex items-start gap-2">
          <span className={`mt-0.5 ${accentClass}`}>✓</span>
          <span>
            <span className="font-medium text-white">{freeTier.summary}</span>
          </span>
        </li>
        {freeTier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className={`mt-0.5 ${accentClass}`}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link href={ctaHref} className={buttonClass}>
        {ctaLabel}
      </Link>
    </div>
  );
}
