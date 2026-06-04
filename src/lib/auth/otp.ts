import { createServiceClient } from "@/lib/supabase/server";
import { generateOtp, hashOtp } from "@/lib/auth/crypto";
import { sendOtpEmail } from "@/lib/resend";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "signup" | "signin";

interface IssueOtpOptions {
  email: string;
  purpose: OtpPurpose;
  metadata?: Record<string, unknown>;
}

export async function issueOtp({ email, purpose, metadata = {} }: IssueOtpOptions) {
  const code = generateOtp();
  const supabase = createServiceClient();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error } = await supabase.from("ni_auth_otp").insert({
    email: email.toLowerCase().trim(),
    code_hash: hashOtp(code),
    purpose,
    metadata,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to store OTP: ${error.message}`);
  }

  const emailResult = await sendOtpEmail({ to: email, code, purpose });
  if (emailResult.error) {
    throw new Error(emailResult.error);
  }

  return { expiresAt };
}

export async function verifyOtp({
  email,
  purpose,
  code,
}: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<{ valid: boolean; metadata: Record<string, unknown> }> {
  const supabase = createServiceClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data: rows, error } = await supabase
    .from("ni_auth_otp")
    .select("id, code_hash, metadata, expires_at, used_at, attempts")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !rows?.[0]) {
    return { valid: false, metadata: {} };
  }

  const row = rows[0];

  if (row.used_at || new Date(row.expires_at) < new Date()) {
    return { valid: false, metadata: {} };
  }

  if ((row.attempts ?? 0) >= MAX_ATTEMPTS) {
    return { valid: false, metadata: {} };
  }

  const valid = row.code_hash === hashOtp(code.trim());

  await supabase
    .from("ni_auth_otp")
    .update({
      attempts: (row.attempts ?? 0) + 1,
      ...(valid ? { used_at: new Date().toISOString() } : {}),
    })
    .eq("id", row.id);

  return {
    valid,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}
