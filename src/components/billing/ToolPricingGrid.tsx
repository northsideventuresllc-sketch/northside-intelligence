import Link from "next/link";
import { ToolFreemiumPricingGrid } from "@/components/billing/ToolFreemiumPricingGrid";
import type { ToolPricing } from "@/lib/billing/tool-pricing";

interface ToolPricingGridProps {
  toolSlug: string;
  toolName: string;
  pricing: ToolPricing;
  isLoggedIn: boolean;
  returnPath: string;
}

/** Guest-facing pricing: monthly unlimited subscription only. */
export function ToolPricingGrid({
  toolSlug,
  toolName,
  pricing,
  isLoggedIn,
  returnPath,
}: ToolPricingGridProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-lg font-semibold text-white">Choose Your Plan</h2>

      <ToolFreemiumPricingGrid
        toolSlug={toolSlug}
        toolName={toolName}
        pricing={pricing}
        isLoggedIn={isLoggedIn}
        returnPath={returnPath}
      />

      {!isLoggedIn && (
        <p className="text-center text-xs text-ni-muted">
          <Link href="/auth/signin" className="text-cyan-300 hover:text-cyan-200">
            Sign In
          </Link>{" "}
          for additional options, or{" "}
          <a href="/#pricing" className="text-cyan-300 hover:text-cyan-200">
            view NI plans
          </a>{" "}
          for bundled access.
        </p>
      )}
    </div>
  );
}
