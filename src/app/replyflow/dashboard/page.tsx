import { redirect } from "next/navigation";
import { getReplyFlowAccess } from "@/lib/billing/replyflow-access";
import {
  mapReplyFlowHistoryRow,
  REPLYFLOW_HISTORY_LIMIT,
  type ReplyFlowHistoryEntry,
} from "@/lib/replyflow/history";
import { portalSignInUrl } from "@/lib/replyflow/auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import DashboardClient from "./DashboardClient";
import { AddToToolCasePrompt } from "@/components/billing/AddToToolCasePrompt";

export default async function ReplyFlowDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(portalSignInUrl());

  const access = await getReplyFlowAccess(user.id);

  if (!access.canUseTool) {
    return (
      <div className="relative min-h-screen">
        <DashboardClient
          email={user.email ?? ""}
          plan={access.plan}
          planLabel={access.planLabel}
          repliesUsed={0}
          repliesLimit={0}
          hasUnlimitedAccess={false}
          niTier={access.niTier}
          history={[]}
          gated
          gateContent={<AddToToolCasePrompt toolSlug="replyflow" toolName="ReplyFlow" variant="replyflow" />}
        />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("replyflow_profiles")
    .select("replies_used_this_month, last_tone, last_scenario")
    .eq("id", user.id)
    .single();

  const { data: historyRows } = await supabase
    .from("replyflow_replies")
    .select("id, customer_message, tone, scenario, generated_reply, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(REPLYFLOW_HISTORY_LIMIT);

  const used = profile?.replies_used_this_month || 0;
  const history: ReplyFlowHistoryEntry[] = (historyRows ?? []).map(mapReplyFlowHistoryRow);

  return (
    <DashboardClient
      email={user.email ?? ""}
      plan={access.plan}
      planLabel={access.planLabel}
      repliesUsed={used}
      repliesLimit={access.repliesLimit}
      hasUnlimitedAccess={access.hasUnlimitedAccess}
      niTier={access.niTier}
      initialTone={profile?.last_tone ?? undefined}
      initialScenario={profile?.last_scenario ?? undefined}
      history={history}
    />
  );
}
