import { redirect } from "next/navigation";
import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { Sector3ToolSettingsClient } from "@/components/sector3/Sector3ToolSettingsClient";

export default async function GapScanSettingsPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/gapscan/login?redirect=/gapscan/settings");
  }

  const billingState = await getUserBillingState(user.id);
  const hasUnlimited = userHasUnlimitedToolAccess(billingState, "gapscan");
  const isAgentic = userHasAgenticAccess(billingState, "gapscan");
  const spec = getSector3FreeTierSpec("gapscan");

  const { data: profile } = await supabase
    .from("gapscan_profiles")
    .select("scans_used_this_month")
    .eq("id", user.id)
    .single();

  const scansUsed = profile?.scans_used_this_month || 0;
  const currentTier: "free" | "saas" | "agentic" = isAgentic
    ? "agentic"
    : hasUnlimited
      ? "saas"
      : "free";

  const currentPlanLabel = isAgentic
    ? "Agentic Headless Tier ($45/mo)"
    : hasUnlimited
      ? "SaaS Monthly ($18/mo)"
      : "Free Community Plan";

  return (
    <div className="min-h-screen bg-[#07090E] text-white py-10">
      <Sector3ToolSettingsClient
        toolSlug="gapscan"
        toolName="GapScan"
        brandColor="#FF3B30"
        logoSrc="/logos/gapscan.svg"
        currentPlanLabel={currentPlanLabel}
        currentTier={currentTier}
        usageStats={{
          used: scansUsed,
          limit: hasUnlimited ? null : spec.monthlyCap,
          label: "scans",
        }}
        renewalDate={billingState.currentPeriodEnd ? new Date(billingState.currentPeriodEnd).toLocaleDateString() : null}
        isAgenticUser={isAgentic}
      />
    </div>
  );
}
