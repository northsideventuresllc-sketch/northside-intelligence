import { redirect } from "next/navigation";
import { AddToToolCasePrompt } from "@/components/billing/AddToToolCasePrompt";
import { Sector3ToolDashboard } from "@/components/sector3/Sector3ToolDashboard";
import type { DashboardField } from "@/components/sector3/Sector3ToolDashboard";
import { getSector3ToolAccess } from "@/lib/sector3-tools/access";
import { createSector3ToolAuth } from "@/lib/sector3-tools/auth";
import { ensureSector3ToolProfile } from "@/lib/sector3-tools/profile";
import type { Sector3SessionRow, Sector3ToolRuntimeConfig } from "@/lib/sector3-tools/types";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

interface DashboardPageOptions {
  apiPath: string;
  fields: DashboardField[];
  primaryLabel: string;
  usageColumn: string;
  buildPayload: (values: Record<string, string>) => Record<string, unknown>;
}

export function createSector3DashboardPage(
  config: Sector3ToolRuntimeConfig,
  options: DashboardPageOptions
) {
  return async function Sector3DashboardPage() {
    const auth = createSector3ToolAuth(config);
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect(auth.portalSignInUrl());

    const access = await getSector3ToolAccess(user.id, config);
    const admin = createServiceClient();
    await ensureSector3ToolProfile(admin, config, user.id, user.email);

    if (!access.canUseTool) {
      return (
        <Sector3ToolDashboard
          config={config}
          apiPath={options.apiPath}
          fields={options.fields}
          primaryLabel={options.primaryLabel}
          history={[]}
          email={user.email ?? ""}
          planLabel={access.planLabel}
          usageCount={0}
          usageLimit={0}
          hasUnlimitedAccess={false}
          niTier={access.niTier}
          gated
          gateContent={
            <AddToToolCasePrompt
              toolSlug={config.slug}
              toolName={config.displayName}
              variant="portal"
            />
          }
          buildPayload={options.buildPayload}
        />
      );
    }

    const { data: profile } = await supabase
      .from(config.profileTable)
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: historyRows } = await supabase
      .from(config.sessionsTable)
      .select("id, input_summary, result_text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const row = profile as unknown as Record<string, number> | null;
    const used = Number(row?.[options.usageColumn] ?? 0);
    const history: Sector3SessionRow[] = (historyRows ?? []) as Sector3SessionRow[];

    return (
      <Sector3ToolDashboard
        config={config}
        apiPath={options.apiPath}
        fields={options.fields}
        primaryLabel={options.primaryLabel}
        history={history}
        email={user.email ?? ""}
        planLabel={access.planLabel}
        usageCount={used}
        usageLimit={access.usageLimit}
        hasUnlimitedAccess={access.hasUnlimitedAccess}
        niTier={access.niTier}
        buildPayload={options.buildPayload}
      />
    );
  };
}
