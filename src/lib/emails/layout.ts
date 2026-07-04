import { NI_EMAIL } from "@/lib/emails/brand";
import { emailDivider } from "@/lib/emails/components";

export interface NiEmailLayoutOptions {
  /** Shown in the inbox preview pane (keep under ~140 chars). */
  previewText: string;
  /** Main HTML content inserted between header and footer. */
  body: string;
  /** Optional footer note below legal links (e.g. unsubscribe reason). */
  footerNote?: string;
}

/**
 * Base NI email shell — dark glass-panel aesthetic matching northsideintelligence.com.
 * Uses table layout and inline styles for broad email client support.
 */
export function renderNiEmail({ previewText, body, footerNote }: NiEmailLayoutOptions): string {
  const { colors, fonts, layout, urls, copy } = NI_EMAIL;

  const hiddenPreview = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      ${escapeHtml(previewText)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
    </div>
  `.trim();

  const header = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="left" style="padding-bottom:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:14px;vertical-align:middle;">
                <a href="${urls.portal}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                  <img src="${urls.emblem}" alt="${copy.company}" width="40" height="40" style="display:block;border-radius:10px;border:1px solid ${colors.border};" />
                </a>
              </td>
              <td style="vertical-align:middle;">
                <a href="${urls.portal}" target="_blank" rel="noopener noreferrer" style="font-family:${fonts.sans};font-size:15px;font-weight:600;color:${colors.text};text-decoration:none;">
                  ${copy.company}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td height="1" style="background:linear-gradient(to right, transparent, rgba(0, 212, 255, 0.35), transparent);font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>
  `.trim();

  const footer = `
    ${emailDivider()}
    <p style="margin:0 0 12px;font-family:${fonts.sans};font-size:13px;line-height:1.5;color:${colors.cyanSoft};text-align:center;">
      ${copy.tagline}
    </p>
    <p style="margin:0 0 16px;font-family:${fonts.sans};font-size:12px;line-height:1.6;color:${colors.muted};text-align:center;">
      <a href="${urls.terms}" style="color:${colors.muted};text-decoration:underline;">Terms</a>
      &nbsp;&middot;&nbsp;
      <a href="${urls.privacy}" style="color:${colors.muted};text-decoration:underline;">Privacy</a>
      &nbsp;&middot;&nbsp;
      <a href="${urls.support}" style="color:${colors.muted};text-decoration:underline;">Support</a>
    </p>
    ${
      footerNote
        ? `<p style="margin:0 0 16px;font-family:${fonts.sans};font-size:12px;line-height:1.6;color:${colors.muted};text-align:center;">${escapeHtml(footerNote)}</p>`
        : ""
    }
    <p style="margin:0;font-family:${fonts.sans};font-size:12px;line-height:1.6;color:${colors.muted};text-align:center;">
      &copy; ${copy.copyrightYear} ${copy.company}<br />
      &copy; ${copy.copyrightYear} ${copy.venturesGroup}
    </p>
  `.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${copy.company}</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.bg};color:${colors.text};">
  ${hiddenPreview}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${colors.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="${layout.maxWidth}" cellpadding="0" cellspacing="0" style="max-width:${layout.maxWidth}px;width:100%;background-color:${colors.navy};border:1px solid ${colors.border};border-radius:${layout.radius}px;box-shadow:0 8px 32px rgba(0, 0, 0, 0.4);">
          <tr>
            <td style="padding:${layout.contentPadding}px;">
              ${header}
              <div style="padding-top:24px;">
                ${body}
              </div>
              ${footer}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-family:${fonts.sans};font-size:11px;line-height:1.5;color:${colors.muted};text-align:center;">
          Sent by ${copy.company} &middot; <a href="${urls.portal}" style="color:${colors.muted};text-decoration:underline;">${urls.portal.replace("https://", "")}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
