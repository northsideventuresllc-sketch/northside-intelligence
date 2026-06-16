import { redirect } from "next/navigation";
import { getReplyFlowAccess } from "@/lib/billing/replyflow-access";
import { portalSignInUrl } from "@/lib/replyflow/auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import DashboardClient from "./DashboardClient";

export default async function ReplyFlowDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(portalSignInUrl());

  const { data: profile } = await supabase
    .from("replyflow_profiles")
    .select("replies_used_this_month")
    .eq("id", user.id)
    .single();

  const access = await getReplyFlowAccess(user.id);
  const used = profile?.replies_used_this_month || 0;

  return (
    <DashboardClient
      email={user.email ?? ""}
      plan={access.plan}
      planLabel={access.planLabel}
      repliesUsed={used}
      repliesLimit={access.repliesLimit}
      hasUnlimitedAccess={access.hasUnlimitedAccess}
      niTier={access.niTier}
    />
  );
}
