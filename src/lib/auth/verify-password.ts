import type { Session, User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";

export interface PasswordVerificationResult {
  user: User;
  session: Session;
}

/** Verifies credentials with the service role so Supabase CAPTCHA rules do not block server-side login. */
export async function verifyPasswordWithServiceRole(
  email: string,
  password: string
): Promise<PasswordVerificationResult | null> {
  const admin = createServiceClient();
  const { data, error } = await admin.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (error || !data.user || !data.session) {
    return null;
  }

  return { user: data.user, session: data.session };
}
