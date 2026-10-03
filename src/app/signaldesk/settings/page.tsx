import { redirect } from "next/navigation";
import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { Sector3ToolSettingsClient } from "@/components/sector3/Sector3ToolSettingsClient";

export default async function SignalDeskSettingsPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signaldesk/login?redirect=/signaldesk/settings");
  }

  const billingState = await getUserBillingState(user.id);
  const hasUnlimited = userHasUnlimitedToolAccess(billingState, "signaldesk");
  const isAgentic = userHasAgenticAccess(billingState, "signaldesk");
  const spec = getSector3FreeTierSpec("signaldesk");

  const { data: profile } = await supabase
    .from("signaldesk_profiles")
    .select("signals_used_this_month")
    .eq("id", user.id)
    .single();

  const signalsUsed = profile?.signals_used_this_month || 0;
  const currentTier: "free" | "saas" | "agentic" = isAgentic
    ? "agentic"
    : hasUnlimited
      ? "saas"
      : "free";

  const currentPlanLabel = isAgentic
    ? "Agentic Headless Tier ($59/mo)"
    : hasUnlimited
      ? "SaaS Monthly ($24/mo)"
      : "Free Community Plan";

  return (
    <div className="min-h-screen bg-[#060D0B] text-white py-10">
      <Sector3ToolSettingsClient
        toolSlug="signaldesk"
        toolName="Signal Desk"
        brandColor="#10B981"
        logoSrc="/logos/signaldesk.svg"
        currentPlanLabel={currentPlanLabel}
        currentTier={currentTier}
        usageStats={{
          used: signalsUsed,
          limit: hasUnlimited ? null : spec.monthlyCap,
          label: "signals",
        }}
        renewalDate={billingState.currentPeriodEnd ? new Date(billingState.currentPeriodEnd).toLocaleDateString() : null}
        isAgenticUser={isAgentic}
      />
    </div>
  );
}
