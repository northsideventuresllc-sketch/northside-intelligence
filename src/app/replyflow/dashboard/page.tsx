import { redirect } from "next/navigation";
import { portalSignInUrl } from "@/lib/replyflow/auth";
import {
  getDeploymentTier,
  getPlanLimits,
  normalizeUserPlan,
  PLAN_LABELS,
} from "@/lib/replyflow/tier";

const PLAN_LIMITS = getPlanLimits(getDeploymentTier());
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
    .select("plan, replies_used_this_month")
    .eq("id", user.id)
    .single();

  const plan = normalizeUserPlan(profile?.plan);
  const used = profile?.replies_used_this_month || 0;
  const limit = PLAN_LIMITS[plan] || 10;
  const planLabel = PLAN_LABELS[plan] || "Free";

  return (
    <DashboardClient
      email={user.email ?? ""}
      plan={plan}
      planLabel={planLabel}
      repliesUsed={used}
      repliesLimit={limit}
    />
  );
}
