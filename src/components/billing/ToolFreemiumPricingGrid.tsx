import { ToolFreePricingCard } from "@/components/billing/ToolFreePricingCard";
import { ToolMonthlyPricingCard } from "@/components/billing/ToolMonthlyPricingCard";
import type { ToolPricing } from "@/lib/billing/tool-pricing";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";

interface ToolFreemiumPricingGridProps {
  toolSlug: string;
  toolName: string;
  pricing: ToolPricing;
  isLoggedIn: boolean;
  returnPath: string;
  variant?: "portal" | "replyflow" | "grantbot";
}

export function ToolFreemiumPricingGrid({
  toolSlug,
  toolName,
  pricing,
  isLoggedIn,
  returnPath,
  variant = "portal",
}: ToolFreemiumPricingGridProps) {
  const freeTier = getSector3FreeTierSpec(toolSlug);
  const isReplyflow = variant === "replyflow";
  const isGrantbot = variant === "grantbot";
  const mutedClass = isReplyflow ? "text-rf-muted" : isGrantbot ? "text-gb-muted" : "text-ni-muted";

  return (
    <div className="space-y-4">
      <p className={`text-center text-sm ${mutedClass}`}>
        Start free with {freeTier.summary}, or subscribe for unlimited access.
      </p>

      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <ToolFreePricingCard
          toolSlug={toolSlug}
          toolName={toolName}
          isLoggedIn={isLoggedIn}
          returnPath={returnPath}
          variant={variant}
        />
        <ToolMonthlyPricingCard
          toolSlug={toolSlug}
          toolName={toolName}
          pricing={pricing}
          isLoggedIn={isLoggedIn}
          returnPath={returnPath}
          variant={variant}
        />
      </div>
    </div>
  );
}
