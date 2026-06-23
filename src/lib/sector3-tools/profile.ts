import type { SupabaseClient } from "@supabase/supabase-js";
import { SECTOR3_TOOL_CONFIGS } from "./configs";
import type { Sector3ToolRuntimeConfig } from "./types";

export async function ensureSector3ToolProfile(
  admin: SupabaseClient,
  config: Sector3ToolRuntimeConfig,
  userId: string,
  email?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const normalizedEmail = email?.trim().toLowerCase() ?? null;

  const { error } = await admin.from(config.profileTable).upsert(
    {
      id: userId,
      email: normalizedEmail,
      tier: "free",
      [config.usageColumn]: 0,
      [config.resetColumn]: now,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    throw new Error(`Failed to provision ${config.displayName} profile: ${error.message}`);
  }
}

/** Provision all portal-hosted Sector 3 tool profiles (GrantBot + Signal Desk, GapScan, BridgeAI). */
export async function ensureAllSector3ToolProfiles(
  admin: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<void> {
  for (const config of SECTOR3_TOOL_CONFIGS) {
    await ensureSector3ToolProfile(admin, config, userId, email);
  }
}
