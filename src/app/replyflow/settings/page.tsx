import { redirect } from "next/navigation";
import { getUserBillingState, userHasUnlimitedToolAccess, userHasAgenticAccess } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { Sector3ToolSettingsClient } from "@/components/sector3/Sector3ToolSettingsClient";

export default async function ReplyFlowSettingsPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/replyflow/login?redirect=/replyflow/settings");
  }

  const billingState = await getUserBillingState(user.id);
  const hasUnlimited = userHasUnlimitedToolAccess(billingState, "replyflow");
  const isAgentic = userHasAgenticAccess(billingState, "replyflow");

  const { data: profile } = await supabase
    .from("replyflow_profiles")
    .select("replies_used_this_month")
    .eq("id", user.id)
    .single();

  const repliesUsed = profile?.replies_used_this_month || 0;
  const currentTier: "free" | "saas" | "agentic" = isAgentic
    ? "agentic"
    : hasUnlimited
      ? "saas"
      : "free";

  const currentPlanLabel = isAgentic
    ? "Agentic Tier ($149.99/mo)"
    : hasUnlimited
      ? "Core Plan ($15/mo)"
      : "Free Starter (10 replies)";

  return (
    <div className="min-h-screen bg-[#07090F] text-white py-10">
      <Sector3ToolSettingsClient
        toolSlug="replyflow"
        toolName="ReplyFlow"
        brandColor="#4F46E5"
        logoSrc="/logos/replyflow.svg"
        currentPlanLabel={currentPlanLabel}
        currentTier={currentTier}
        usageStats={{
          used: repliesUsed,
          limit: hasUnlimited ? null : 10,
          label: "replies",
        }}
        renewalDate={billingState.currentPeriodEnd ? new Date(billingState.currentPeriodEnd).toLocaleDateString() : null}
        isAgenticUser={isAgentic}
      />
    </div>
  );
}
