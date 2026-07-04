import {
  emailButton,
  emailHeading,
  emailSmallPrint,
  emailText,
  emailTextHtml,
} from "@/lib/emails/components";
import { renderNiEmail } from "@/lib/emails/layout";

export interface NiGeneralEmailOptions {
  previewText: string;
  heading: string;
  /** Plain-text paragraphs rendered as body copy. */
  paragraphs?: string[];
  /** Optional raw HTML paragraph (already sanitized by caller). */
  htmlParagraph?: string;
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  smallPrint?: string;
  footerNote?: string;
}

/**
 * General-purpose NI transactional email template.
 * Use for welcome messages, notifications, alerts, and product updates.
 */
export function renderGeneralNiEmail({
  previewText,
  heading,
  paragraphs = [],
  htmlParagraph,
  primaryAction,
  secondaryAction,
  smallPrint,
  footerNote,
}: NiGeneralEmailOptions): string {
  const bodyParts: string[] = [emailHeading(heading)];

  for (const paragraph of paragraphs) {
    bodyParts.push(emailText(paragraph));
  }

  if (htmlParagraph) {
    bodyParts.push(emailTextHtml(htmlParagraph));
  }

  if (primaryAction) {
    bodyParts.push(emailButton({ ...primaryAction, variant: "primary" }));
  }

  if (secondaryAction) {
    bodyParts.push(emailButton({ ...secondaryAction, variant: "secondary" }));
  }

  if (smallPrint) {
    bodyParts.push(emailSmallPrint(smallPrint));
  }

  return renderNiEmail({
    previewText,
    body: bodyParts.join("\n"),
    footerNote,
  });
}

/** Example welcome email — useful for previews and as a copy reference. */
export function renderWelcomeEmailExample({
  name,
  dashboardUrl,
}: {
  name: string;
  dashboardUrl: string;
}): string {
  return renderGeneralNiEmail({
    previewText: `Welcome to Northside Intelligence, ${name}. Your account is ready.`,
    heading: "Welcome to the ecosystem",
    paragraphs: [
      `Hi ${name}, thanks for joining Northside Intelligence.`,
      "One account unlocks every tool in the NI ecosystem — ReplyFlow, GrantBot, and everything still on the horizon.",
    ],
    primaryAction: {
      href: dashboardUrl,
      label: "Go to your account",
    },
    secondaryAction: {
      href: "https://northsideintelligence.com/#tools",
      label: "Explore tools",
    },
    smallPrint:
      "Need help getting started? Reply to this email or contact support@northsideintelligence.com.",
    footerNote: "You received this email because you created a Northside Intelligence account.",
  });
}
