import { redirect } from "next/navigation";
import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { Sector3ToolSettingsClient } from "@/components/sector3/Sector3ToolSettingsClient";

export default async function GrantBotSettingsPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/grantbot/login?redirect=/grantbot/settings");
  }

  const billingState = await getUserBillingState(user.id);
  const hasUnlimited = userHasUnlimitedToolAccess(billingState, "grantbot");
  const isAgentic = userHasAgenticAccess(billingState, "grantbot");

  const { data: profile } = await supabase
    .from("grantbot_profiles")
    .select("grants_used_this_month")
    .eq("id", user.id)
    .single();

  const grantsUsed = profile?.grants_used_this_month || 0;
  const currentTier: "free" | "saas" | "agentic" = isAgentic
    ? "agentic"
    : hasUnlimited
      ? "saas"
      : "free";

  const currentPlanLabel = isAgentic
    ? "GrantBot Agentic Tier ($48/mo)"
    : hasUnlimited
      ? "GrantBot SaaS Monthly ($19/mo)"
      : "Free Grant Finder";

  return (
    <div className="min-h-screen bg-[#070D18] text-white py-10">
      <Sector3ToolSettingsClient
        toolSlug="grantbot"
        toolName="GrantBot"
        brandColor="#00FFCC"
        logoSrc="/logos/grantbot.svg"
        currentPlanLabel={currentPlanLabel}
        currentTier={currentTier}
        usageStats={{
          used: grantsUsed,
          limit: hasUnlimited ? null : 5,
          label: "grant drafts",
        }}
        renewalDate={billingState.currentPeriodEnd ? new Date(billingState.currentPeriodEnd).toLocaleDateString() : null}
        isAgenticUser={isAgentic}
      />
    </div>
  );
}
