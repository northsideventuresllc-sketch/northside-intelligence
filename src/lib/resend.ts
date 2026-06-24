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
            <td style="padding: 8px 0; color: #8b95a8; font-size: 14px;">${item.label}</td>
            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-size: 14px;">${formatUsd(Math.abs(item.amountCents))}</td>
          </tr>`
          )
          .join("")
      : `<tr>
          <td style="padding: 8px 0; color: #8b95a8; font-size: 14px;">${serviceName}</td>
          <td style="padding: 8px 0; text-align: right; color: #ffffff; font-size: 14px;">${formatUsd(totalPriceCents)}</td>
        </tr>`;

  const { error } = await resend.emails.send(
    {
      from: FROM,
      to: [to],
      subject: `Invoice ${invoiceNumber} — ${serviceName} | Northside Intelligence`,
      html: `
        <div style="font-family: system-ui, sans-serif; background: #07080c; color: #e8eaef; padding: 32px; max-width: 560px;">
          <p style="color: #8b95a8; font-size: 14px; margin: 0 0 8px;">Northside Intelligence</p>
          <h1 style="font-size: 22px; margin: 0 0 4px; color: #00d4ff;">Invoice</h1>
          <p style="color: #8b95a8; font-size: 13px; margin: 0 0 24px;">#${invoiceNumber} · ${paidDate}</p>

          <p style="color: #e8eaef; margin: 0 0 4px;">Bill to: ${customerName}</p>
          <p style="color: #8b95a8; font-size: 14px; margin: 0 0 24px;">${to}</p>

          <h2 style="font-size: 16px; color: #ffffff; margin: 0 0 12px;">${serviceName}</h2>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${lineItemsHtml}
          </table>

          <div style="border-top: 1px solid #1e2430; padding-top: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px; color: #8b95a8; font-size: 14px;">Service total: <span style="color: #ffffff; float: right;">${formatUsd(totalPriceCents)}</span></p>
            <p style="margin: 0; color: #00d4ff; font-size: 16px; font-weight: 600;">Amount paid: <span style="float: right;">${formatUsd(amountPaidCents)}</span></p>
          </div>

          <p style="color: #8b95a8; font-size: 13px; margin: 0 0 24px;">${paymentLabel}</p>

          <p style="color: #8b95a8; font-size: 13px; line-height: 1.6; margin: 0;">
            Thank you for your payment. Our team will reach out shortly to begin your engagement.
            Questions? Reply to this email or contact
            <a href="mailto:support@northsideintelligence.com" style="color: #00d4ff;">support@northsideintelligence.com</a>.
          </p>
        </div>
      `,
    },
    { idempotencyKey: `service-invoice/${invoiceNumber}` }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}
