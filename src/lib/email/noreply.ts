import "server-only";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const NOREPLY_FROM =
  process.env.NI_NOREPLY_FROM_EMAIL ??
  "Northside Intelligence <noreply@northsideintelligence.com>";

export interface TransactionalEmailInput {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}

export async function sendNoreplyEmail(
  input: TransactionalEmailInput
): Promise<{ error?: string }> {
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
    ctaLabel && ctaHref
      ? `<p style="margin: 24px 0;"><a href="${ctaHref}" style="display: inline-block; background: #00d4ff; color: #07080c; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">${ctaLabel}</a></p>`
      : "";

  return `
    <div style="font-family: system-ui, sans-serif; background: #07080c; color: #e8eaef; padding: 32px; max-width: 560px;">
      <p style="color: #8b95a8; font-size: 14px; margin: 0 0 16px;">Northside Intelligence</p>
      <h1 style="font-size: 22px; margin: 0 0 12px; color: #00d4ff;">${title}</h1>
      <p style="color: #8b95a8; line-height: 1.6;">${body}</p>
      ${ctaBlock}
      <p style="color: #8b95a8; font-size: 12px; margin-top: 32px;">Manage notification preferences in your account settings.</p>
    </div>
  `;
}
