import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import GapScanDashboardClient from "./DashboardClient";

export default async function GapScanDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <GapScanDashboardClient
        email=""
        planLabel="Free Community Scan"
        scansUsed={0}
        scansLimit={10}
        hasUnlimitedAccess={false}
        niTier="free"
        isAgenticUser={false}
      />
    );
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
  const planLabel = isAgentic
    ? "Agentic Headless Tier"
    : hasUnlimited
      ? "SaaS Unlimited Plan"
      : "Free Community Scan";

  return (
    <GapScanDashboardClient
      email={user.email ?? ""}
      planLabel={planLabel}
      scansUsed={scansUsed}
      scansLimit={hasUnlimited ? null : spec.monthlyCap}
      hasUnlimitedAccess={hasUnlimited}
      niTier={billingState.niTier}
      isAgenticUser={isAgentic}
    />
  );
}
