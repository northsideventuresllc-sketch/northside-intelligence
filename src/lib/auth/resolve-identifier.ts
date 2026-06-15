import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import { createServiceClient } from "@/lib/supabase/server";

export function isEmail(value: string): boolean {
  return /^[^@]+@[^@]+\.[^@]+$/.test(value);
}

/** Normalizes login identifiers, including optional @username prefixes. */
export function normalizeLoginIdentifier(identifier: string): string {
  let trimmed = identifier.trim();
  if (trimmed.startsWith("@") && !isEmail(trimmed)) {
    trimmed = trimmed.slice(1).trim();
  }
  return trimmed;
}

export async function resolveIdentifierToEmail(identifier: string): Promise<string | null> {
  const trimmed = normalizeLoginIdentifier(identifier);
  if (!trimmed) return null;

  const admin = createServiceClient();

  const { data: resolvedEmail, error: rpcError } = await admin.rpc(
    "ni_portal_email_for_login",
    { login_identifier: trimmed }
  );

  if (!rpcError && typeof resolvedEmail === "string" && resolvedEmail.length > 0) {
    return resolvedEmail.toLowerCase();
  }

  if (isEmail(trimmed)) {
    return trimmed.toLowerCase();
  }

  const username = trimmed.toLowerCase();
  if (!isValidUsername(username)) return null;

  const { data } = await admin
    .from("ni_portal_profiles")
    .select("email")
    .ilike("username", username)
    .maybeSingle();

  if (data?.email) {
    return data.email.toLowerCase();
  }

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
