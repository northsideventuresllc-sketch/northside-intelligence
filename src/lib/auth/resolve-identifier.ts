import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import { createServiceClient } from "@/lib/supabase/server";

export function isEmail(value: string): boolean {
  return value.includes("@");
}

export async function resolveIdentifierToEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (isEmail(trimmed)) {
    return trimmed.toLowerCase();
  }

  const username = trimmed.toLowerCase();
  if (!isValidUsername(username)) return null;

  const admin = createServiceClient();
  const { data } = await admin
    .from("ni_portal_profiles")
    .select("email")
    .ilike("username", username)
    .maybeSingle();

  if (data?.email) {
    return data.email.toLowerCase();
  }

  // Legacy accounts may only have username stored in auth.users metadata.
  const { data: authUsers, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error || !authUsers?.users?.length) {
    return null;
  }

  const match = authUsers.users.find((user) => {
    const metaUsername = user.user_metadata?.username;
    return (
      typeof metaUsername === "string" &&
      normalizeUsername(metaUsername) === username
    );
  });

  return match?.email?.toLowerCase() ?? null;
}
