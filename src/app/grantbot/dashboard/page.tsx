import { redirect } from "next/navigation";
import { getGrantBotAccess } from "@/lib/grantbot/access";
import {
  mapGrantBotHistoryRow,
  GRANTBOT_HISTORY_LIMIT,
  type GrantBotHistoryEntry,
} from "@/lib/grantbot/history";
import { portalSignInUrl } from "@/lib/grantbot/auth";
import { ensureGrantBotProfile } from "@/lib/grantbot/profile";
import { createSector3ServiceClient } from "@/lib/sector3-tools/service-client";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import DashboardClient from "./DashboardClient";
import { AddToToolCasePrompt } from "@/components/billing/AddToToolCasePrompt";

export default async function GrantBotDashboardPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(portalSignInUrl());

  const access = await getGrantBotAccess(user.id);

  const admin = await createSector3ServiceClient();
  await ensureGrantBotProfile(admin, user.id, user.email);

  if (!access.canUseTool) {
    return (
      <div className="relative min-h-screen">
        <DashboardClient
          email={user.email ?? ""}
          planLabel={access.planLabel}
          grantsUsed={0}
          grantsLimit={0}
          hasUnlimitedAccess={false}
          niTier={access.niTier}
          history={[]}
          gated
          gateContent={
            <AddToToolCasePrompt toolSlug="grantbot" toolName="GrantBot" variant="grantbot" />
          }
        />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("grantbot_profiles")
    .select("grants_used_this_month, last_mode, last_category")
    .eq("id", user.id)
    .single();

  const { data: historyRows } = await supabase
    .from("grantbot_sessions")
    .select(
      "id, mode, org_description, category, grant_title, funder, prompt_questions, result_text, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(GRANTBOT_HISTORY_LIMIT);

  const used = profile?.grants_used_this_month || 0;
  const history: GrantBotHistoryEntry[] = (historyRows ?? []).map(mapGrantBotHistoryRow);

  return (
    <DashboardClient
      email={user.email ?? ""}
      planLabel={access.planLabel}
      grantsUsed={used}
      grantsLimit={access.grantsLimit}
      hasUnlimitedAccess={access.hasUnlimitedAccess}
      niTier={access.niTier}
      initialCategory={profile?.last_category ?? undefined}
      history={history}
    />
  );
}
