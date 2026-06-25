import "server-only";

import { Resend } from "resend";
import { niEmailCta, wrapNiEmailHtml } from "@/lib/email/layout";

const NOREPLY_FROM =
  process.env.NI_NOREPLY_FROM_EMAIL ??
  "Northside Intelligence <noreply@northsideintelligence.com>";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  return apiKey ? new Resend(apiKey) : null;
}

export interface TransactionalEmailInput {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}

export async function sendNoreplyEmail(
  input: TransactionalEmailInput
): Promise<{ error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] noreply email to ${input.to}: ${input.subject}`);
      return {};
    }
    return { error: "Email service not configured (RESEND_API_KEY)" };
  }

  const { error } = await resend.emails.send(
    {
      from: NOREPLY_FROM,
      to: [input.to.trim().toLowerCase()],
      subject: input.subject,
      html: input.html,
    },
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
  );

  if (error) return { error: error.message };
  return {};
}

export function buildNiEmailHtml({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}): string {
  const ctaBlock =
    ctaLabel && ctaHref ? niEmailCta(ctaLabel, ctaHref) : "";

  const content = `
    <p style="margin: 0 0 8px; color: #c5cdd9;">${body}</p>
    ${ctaBlock}`;

  return wrapNiEmailHtml({
    preheader: body,
    headline: title,
    content,
    showPreferencesLink: true,
  });
}
