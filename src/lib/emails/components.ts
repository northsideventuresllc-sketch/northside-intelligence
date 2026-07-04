import { NI_EMAIL } from "@/lib/emails/brand";

const { colors, fonts } = NI_EMAIL;

export function emailHeading(text: string, level: 1 | 2 = 1): string {
  const size = level === 1 ? "24px" : "18px";
  const margin = level === 1 ? "0 0 12px" : "0 0 8px";

  return `<h${level} style="margin:${margin};font-family:${fonts.sans};font-size:${size};font-weight:600;line-height:1.3;color:${colors.cyan};">${escapeHtml(text)}</h${level}>`;
}

export function emailText(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${fonts.sans};font-size:15px;line-height:1.65;color:${colors.muted};">${escapeHtml(text)}</p>`;
}

export function emailTextHtml(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${fonts.sans};font-size:15px;line-height:1.65;color:${colors.muted};">${html}</p>`;
}

export function emailCodeBlock(code: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="padding:20px 24px;background-color:${colors.bg};border:1px solid ${colors.borderStrong};border-radius:12px;">
          <span style="display:block;font-family:${fonts.mono};font-size:32px;font-weight:700;letter-spacing:0.28em;line-height:1.2;color:${colors.white};">${escapeHtml(code)}</span>
        </td>
      </tr>
    </table>
  `.trim();
}

export interface EmailButtonOptions {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}

export function emailButton({ href, label, variant = "primary" }: EmailButtonOptions): string {
  const isPrimary = variant === "primary";
  const background = isPrimary ? colors.buttonBg : "rgba(255, 255, 255, 0.05)";
  const border = isPrimary ? colors.buttonBorder : "rgba(255, 255, 255, 0.12)";
  const textColor = isPrimary ? colors.cyanSoft : colors.text;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="border-radius:12px;background-color:${background};border:1px solid ${border};">
          <a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${fonts.sans};font-size:14px;font-weight:600;line-height:1;color:${textColor};text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `.trim();
}

export function emailDivider(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td height="1" style="background:linear-gradient(to right, transparent, rgba(0, 212, 255, 0.25), transparent);font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>
  `.trim();
}

export function emailSmallPrint(text: string): string {
  return `<p style="margin:0;font-family:${fonts.sans};font-size:13px;line-height:1.6;color:${colors.muted};">${escapeHtml(text)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}
