import {
  emailButton,
  emailCodeBlock,
  emailHeading,
  emailSmallPrint,
  emailText,
} from "@/lib/emails/components";
import { renderNiEmail } from "@/lib/emails/layout";

export function renderAxonAccessCodeEmail({
  code,
  portalUrl,
}: {
  code: string;
  portalUrl: string;
}): string {
  const body = [
    emailHeading("Your AXON access code"),
    emailText(
      "Thank you for subscribing to AXON. Use the code below to enter the AXON environment from your Northside Intelligence portal."
    ),
    emailCodeBlock(code),
    emailButton({ href: portalUrl, label: "Open AXON" }),
    emailSmallPrint(
      "Keep this code private. You can change it anytime inside the AXON portal after your first sign-in."
    ),
  ].join("\n");

  return renderNiEmail({
    previewText: "Your AXON access code is ready.",
    body,
    footerNote: "You received this email because you purchased AXON on Northside Intelligence.",
  });
}
