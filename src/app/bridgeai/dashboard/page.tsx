import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import BridgeAIDashboardClient from "./DashboardClient";

export default async function BridgeAIDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <BridgeAIDashboardClient
        email=""
        planLabel="Free Community Tier"
        workflowsUsed={0}
        workflowsLimit={10}
        hasUnlimitedAccess={false}
        niTier="free"
        isAgenticUser={false}
      />
    );
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
  const planLabel = isAgentic
    ? "Agentic Headless Tier"
    : hasUnlimited
      ? "SaaS Unlimited Plan"
      : "Free Community Tier";

  return (
    <BridgeAIDashboardClient
      email={user.email ?? ""}
      planLabel={planLabel}
      workflowsUsed={workflowsUsed}
      workflowsLimit={hasUnlimited ? null : spec.monthlyCap}
      hasUnlimitedAccess={hasUnlimited}
      niTier={billingState.niTier}
      isAgenticUser={isAgentic}
    />
  );
}
