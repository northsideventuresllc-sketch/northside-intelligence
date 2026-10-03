import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import SignalDeskDashboardClient from "./DashboardClient";

export default async function SignalDeskDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <SignalDeskDashboardClient
        email=""
        planLabel="Free Telemetry Tier"
        signalsUsed={0}
        signalsLimit={10}
        hasUnlimitedAccess={false}
        niTier="free"
        isAgenticUser={false}
      />
    );
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
  const planLabel = isAgentic
    ? "Agentic Headless Tier"
    : hasUnlimited
      ? "SaaS Unlimited Plan"
      : "Free Telemetry Tier";

  return (
    <SignalDeskDashboardClient
      email={user.email ?? ""}
      planLabel={planLabel}
      signalsUsed={signalsUsed}
      signalsLimit={hasUnlimited ? null : spec.monthlyCap}
      hasUnlimitedAccess={hasUnlimited}
      niTier={billingState.niTier}
      isAgenticUser={isAgentic}
    />
  );
}
