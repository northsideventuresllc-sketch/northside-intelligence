import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeUsername } from "@/lib/auth/username";
import { ensureGrantBotProfile } from "@/lib/grantbot/profile";

type AuthUser = Pick<User, "id" | "email" | "user_metadata">;

/** Ensures ni_portal_profiles (and related rows) exist for an authenticated user. */
export async function ensurePortalProfile(
  admin: SupabaseClient,
  user: AuthUser
): Promise<void> {
  const email = user.email?.trim().toLowerCase();
  if (!email) return;

  const meta = user.user_metadata ?? {};
  const metaUsername =
    typeof meta.username === "string" ? normalizeUsername(meta.username) : null;
  const metaFullName =
    typeof meta.full_name === "string" ? meta.full_name.trim() || null : null;

  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("ni_portal_profiles")
    .select("id, username, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, string | null> = { updated_at: now };
    if (existing.username == null && metaUsername) updates.username = metaUsername;
    if (existing.full_name == null && metaFullName) updates.full_name = metaFullName;
    updates.email = email;

    await admin.from("ni_portal_profiles").update(updates).eq("id", user.id);
  } else {
    await admin.from("ni_portal_profiles").insert({
      id: user.id,
      email,
      full_name: metaFullName,
      username: metaUsername,
      two_factor_enabled: true,
      account_type: "personal",
      created_at: now,
      updated_at: now,
    });
  }

  await admin.from("replyflow_profiles").upsert(
    {
      id: user.id,
      email,
      plan: "free",
      replies_used_this_month: 0,
      replies_reset_at: now,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id" }
  );

  await ensureGrantBotProfile(admin, user.id, email);

  await admin.from("ni_subscriptions").upsert(
    { id: user.id, tier: "free", updated_at: now },
    { onConflict: "id", ignoreDuplicates: true }
  );
}
