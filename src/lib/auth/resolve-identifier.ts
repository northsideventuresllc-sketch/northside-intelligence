import { isValidUsername } from "@/lib/auth/username";
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
    .eq("username", username)
    .maybeSingle();

  return data?.email?.toLowerCase() ?? null;
}
