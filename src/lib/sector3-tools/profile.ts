import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sector3ToolRuntimeConfig } from "./types";

export async function ensureSector3ToolProfile(
  admin: SupabaseClient,
  config: Sector3ToolRuntimeConfig,
  userId: string,
  email?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const normalizedEmail = email?.trim().toLowerCase() ?? null;

  await admin.from(config.profileTable).upsert(
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
}
