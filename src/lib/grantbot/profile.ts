import type { SupabaseClient } from "@supabase/supabase-js";

/** Ensures a grantbot_profiles row exists (service role required — no user INSERT policy). */
export async function ensureGrantBotProfile(
  admin: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const normalizedEmail = email?.trim().toLowerCase() ?? null;

  await admin.from("grantbot_profiles").upsert(
    {
      id: userId,
      email: normalizedEmail,
      tier: "free",
      grants_used_this_month: 0,
      grants_reset_at: now,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
}
