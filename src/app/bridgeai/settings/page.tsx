import { redirect } from "next/navigation";
import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { Sector3ToolSettingsClient } from "@/components/sector3/Sector3ToolSettingsClient";

export default async function BridgeAISettingsPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/bridgeai/login?redirect=/bridgeai/settings");
  }

  const billingState = await getUserBillingState(user.id);
  const hasUnlimited = userHasUnlimitedToolAccess(billingState, "bridgeai");
  const isAgentic = userHasAgenticAccess(billingState, "bridgeai");
  const spec = getSector3FreeTierSpec("bridgeai");

  const { data: profile } = await supabase
    .from("bridgeai_profiles")
    .select("workflows_used_this_month")
    .eq("id", user.id)
    .single();

  const workflowsUsed = profile?.workflows_used_this_month || 0;
  const currentTier: "free" | "saas" | "agentic" = isAgentic
    ? "agentic"
    : hasUnlimited
      ? "saas"
      : "free";

  const currentPlanLabel = isAgentic
    ? "Agentic Headless Tier ($69/mo)"
    : hasUnlimited
      ? "SaaS Monthly ($29/mo)"
      : "Free Community Plan";

  return (
    <div className="min-h-screen bg-[#080711] text-white py-10">
      <Sector3ToolSettingsClient
        toolSlug="bridgeai"
        toolName="BridgeAI"
        brandColor="#8A2BE2"
        logoSrc="/logos/bridgeai.svg"
        currentPlanLabel={currentPlanLabel}
        currentTier={currentTier}
        usageStats={{
          used: workflowsUsed,
          limit: hasUnlimited ? null : spec.monthlyCap,
          label: "bridge plans",
        }}
        renewalDate={billingState.currentPeriodEnd ? new Date(billingState.currentPeriodEnd).toLocaleDateString() : null}
        isAgenticUser={isAgentic}
      />
    </div>
  );
}
