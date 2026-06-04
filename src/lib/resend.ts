import { Resend } from "resend";
import type { OtpPurpose } from "@/lib/auth/otp";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "Northside Intelligence <onboarding@resend.dev>";

export async function sendOtpEmail({
  to,
  code,
  purpose,
}: {
  to: string;
  code: string;
  purpose: OtpPurpose;
}): Promise<{ error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] OTP for ${to} (${purpose}): ${code}`);
      return {};
    }
    return { error: "Email service not configured (RESEND_API_KEY)" };
  }

  const action = purpose === "signup" ? "complete your signup" : "sign in securely";

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [to],
      subject: `${code} is your Northside Intelligence verification code`,
      html: `
        <div style="font-family: system-ui, sans-serif; background: #07080c; color: #e8eaef; padding: 32px;">
          <p style="color: #8b95a8; font-size: 14px; margin: 0 0 16px;">Northside Intelligence</p>
          <h1 style="font-size: 22px; margin: 0 0 12px; color: #00d4ff;">Verify your email</h1>
          <p style="color: #8b95a8; line-height: 1.6;">Use this code to ${action}:</p>
          <p style="font-size: 32px; letter-spacing: 0.3em; font-weight: 700; color: #ffffff; margin: 24px 0;">${code}</p>
          <p style="color: #8b95a8; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    },
    { idempotencyKey: `otp/${purpose}/${to.toLowerCase()}/${Math.floor(Date.now() / 60000)}` }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}
