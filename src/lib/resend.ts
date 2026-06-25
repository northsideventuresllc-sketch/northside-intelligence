import { Resend } from "resend";
import type { OtpPurpose } from "@/lib/auth/otp";
import {
  NI_EMAIL_COLORS,
  niEmailCodeDisplay,
  niEmailTextLink,
  wrapNiEmailHtml,
} from "@/lib/email/layout";

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

  const content = `
    <p style="margin: 0 0 4px; color: #c5cdd9;">
      Use this code to ${action}:
    </p>
    ${niEmailCodeDisplay(code)}
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${NI_EMAIL_COLORS.muted};">
      This code expires in 10 minutes. If you didn&rsquo;t request this, you can safely ignore this email.
    </p>`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [to],
      subject: `${code} is your Northside Intelligence verification code`,
      html: wrapNiEmailHtml({
        preheader: `Your verification code is ${code}. Expires in 10 minutes.`,
        eyebrow: "Account Security",
        headline: "Verify Your Email",
        content,
      }),
    },
    { idempotencyKey: `otp/${purpose}/${to.toLowerCase()}/${Math.floor(Date.now() / 60000)}` }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

export interface ServiceInvoiceLineItem {
  label: string;
  amountCents: number;
}

export async function sendServiceInvoiceEmail({
  to,
  customerName,
  serviceName,
  invoiceNumber,
  amountPaidCents,
  totalPriceCents,
  paymentType,
  planMonths,
  lineItems,
  paidAt,
}: {
  to: string;
  customerName: string;
  serviceName: string;
  invoiceNumber: string;
  amountPaidCents: number;
  totalPriceCents: number;
  paymentType: string;
  planMonths: number;
  lineItems: ServiceInvoiceLineItem[];
  paidAt: string;
}): Promise<{ error?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[dev] Service invoice ${invoiceNumber} for ${to}: ${amountPaidCents / 100} USD`
      );
      return {};
    }
    return { error: "Email service not configured (RESEND_API_KEY)" };
  }

  const formatUsd = (cents: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const paidDate = new Date(paidAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paymentLabel =
    paymentType === "plan" && planMonths > 1
      ? `Payment plan — ${formatUsd(amountPaidCents)} (1 of ${planMonths})`
      : paymentType === "bnpl"
        ? `Buy Now, Pay Later — ${formatUsd(amountPaidCents)}`
        : `Paid in full — ${formatUsd(amountPaidCents)}`;

  const lineItemsHtml =
    lineItems.length > 0
      ? lineItems
          .map(
            (item) => `
          <tr>
            <td style="padding: 12px 0; color: ${NI_EMAIL_COLORS.muted}; font-size: 14px; border-bottom: 1px solid ${NI_EMAIL_COLORS.divider};">${item.label}</td>
            <td style="padding: 12px 0; text-align: right; color: ${NI_EMAIL_COLORS.white}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${NI_EMAIL_COLORS.divider};">${formatUsd(Math.abs(item.amountCents))}</td>
          </tr>`
          )
          .join("")
      : `<tr>
          <td style="padding: 12px 0; color: ${NI_EMAIL_COLORS.muted}; font-size: 14px; border-bottom: 1px solid ${NI_EMAIL_COLORS.divider};">${serviceName}</td>
          <td style="padding: 12px 0; text-align: right; color: ${NI_EMAIL_COLORS.white}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${NI_EMAIL_COLORS.divider};">${formatUsd(totalPriceCents)}</td>
        </tr>`;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${NI_EMAIL_COLORS.bg}; border: 1px solid ${NI_EMAIL_COLORS.cardBorder}; border-radius: 10px;">
          <p style="margin: 0 0 4px; color: ${NI_EMAIL_COLORS.text}; font-size: 14px;">
            <strong style="color: ${NI_EMAIL_COLORS.white};">Bill to:</strong> ${customerName}
          </p>
          <p style="margin: 0; color: ${NI_EMAIL_COLORS.muted}; font-size: 14px;">${to}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${NI_EMAIL_COLORS.white};">${serviceName}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      ${lineItemsHtml}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 16px 0 0; border-top: 2px solid ${NI_EMAIL_COLORS.divider};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom: 8px; font-size: 14px; color: ${NI_EMAIL_COLORS.muted};">Service total</td>
              <td style="padding-bottom: 8px; text-align: right; font-size: 14px; color: ${NI_EMAIL_COLORS.white};">${formatUsd(totalPriceCents)}</td>
            </tr>
            <tr>
              <td style="font-size: 16px; font-weight: 600; color: ${NI_EMAIL_COLORS.cyan};">Amount paid</td>
              <td style="text-align: right; font-size: 18px; font-weight: 700; color: ${NI_EMAIL_COLORS.white};">${formatUsd(amountPaidCents)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px; font-size: 13px; color: ${NI_EMAIL_COLORS.muted};">${paymentLabel}</p>

    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${NI_EMAIL_COLORS.muted};">
      Thank you for your payment. Our team will reach out shortly to begin your engagement.
      Questions? Reply to this email or contact
      ${niEmailTextLink("support@northsideintelligence.com", "mailto:support@northsideintelligence.com")}.
    </p>`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [to],
      subject: `Invoice ${invoiceNumber} — ${serviceName} | Northside Intelligence`,
      html: wrapNiEmailHtml({
        preheader: `Invoice #${invoiceNumber} for ${serviceName} — ${formatUsd(amountPaidCents)} paid`,
        eyebrow: "Services",
        headline: "Invoice",
        subheadline: `#${invoiceNumber} · ${paidDate}`,
        content,
      }),
    },
    { idempotencyKey: `service-invoice/${invoiceNumber}` }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}
