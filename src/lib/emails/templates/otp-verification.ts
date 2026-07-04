import {
  emailCodeBlock,
  emailHeading,
  emailSmallPrint,
  emailText,
} from "@/lib/emails/components";
import { renderNiEmail } from "@/lib/emails/layout";
import type { OtpPurpose } from "@/lib/auth/otp";

export function renderOtpVerificationEmail({
  code,
  purpose,
}: {
  code: string;
  purpose: OtpPurpose;
}): string {
  const action = purpose === "signup" ? "complete your signup" : "sign in securely";

  const body = [
    emailHeading("Verify your email"),
    emailText(`Use this code to ${action}:`),
    emailCodeBlock(code),
    emailSmallPrint(
      "This code expires in 10 minutes. If you didn't request this, you can ignore this email."
    ),
  ].join("\n");

  return renderNiEmail({
    previewText: `${code} is your Northside Intelligence verification code`,
    body,
    footerNote: "You received this email because a verification was requested for your account.",
  });
}
