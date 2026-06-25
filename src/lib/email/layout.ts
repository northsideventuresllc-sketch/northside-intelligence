const NI_EMAIL_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";

const NI_EMAIL_LOGO_URL = `${NI_EMAIL_APP_URL}/ni-emblem.svg`;

export const NI_EMAIL_COLORS = {
  bg: "#07080c",
  navy: "#0a1628",
  card: "#0d1524",
  cardBorder: "#1a2a42",
  cyan: "#00d4ff",
  cyanDim: "#00a8cc",
  text: "#e8eaef",
  muted: "#8b95a8",
  divider: "#1e2430",
  white: "#ffffff",
} as const;

export interface NiEmailLayoutOptions {
  /** Hidden preview text shown in inbox list */
  preheader?: string;
  /** Small label above headline, e.g. "Smart Store" */
  eyebrow?: string;
  headline: string;
  /** Optional muted line under headline, e.g. order number */
  subheadline?: string;
  /** Main body HTML */
  content: string;
  /** Extra footer note below standard footer */
  footerNote?: string;
  /** Show account notification preferences link */
  showPreferencesLink?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Primary CTA button for transactional emails */
export function niEmailCta(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 8px;">
      <tr>
        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%);">
          <a href="${safeHref}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #07080c; text-decoration: none; letter-spacing: 0.01em;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Large monospace-style OTP / verification code display */
export function niEmailCodeDisplay(code: string): string {
  const safeCode = escapeHtml(code);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
      <tr>
        <td align="center" style="padding: 24px 20px; background-color: #07080c; border: 1px solid #1a2a42; border-radius: 12px;">
          <span style="font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.35em; color: #ffffff; line-height: 1;">
            ${safeCode}
          </span>
        </td>
      </tr>
    </table>`;
}

/** Secondary text link */
export function niEmailTextLink(label: string, href: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" style="color: #00d4ff; text-decoration: none; font-weight: 500;">${escapeHtml(label)}</a>`;
}

/** Wrap inner content in the full NI branded email shell */
export function wrapNiEmailHtml(options: NiEmailLayoutOptions): string {
  const {
    preheader = "",
    eyebrow = "Northside Intelligence",
    headline,
    subheadline,
    content,
    footerNote,
    showPreferencesLink = false,
  } = options;

  const safePreheader = escapeHtml(preheader || headline);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeHeadline = escapeHtml(headline);
  const safeSubheadline = subheadline ? escapeHtml(subheadline) : "";

  const subheadlineBlock = safeSubheadline
    ? `<p style="margin: 8px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #8b95a8;">${safeSubheadline}</p>`
    : "";

  const preferencesBlock = showPreferencesLink
    ? `<p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #5c6678;">
        <a href="${NI_EMAIL_APP_URL}/account" style="color: #00d4ff; text-decoration: none;">Manage notification preferences</a>
      </p>`
    : "";

  const footerNoteBlock = footerNote
    ? `<p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #5c6678;">${footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${safeHeadline}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-content { padding: 28px 24px !important; }
      .email-header { padding: 28px 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #07080c; width: 100% !important;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #07080c;">
    ${safePreheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #07080c; background-image: linear-gradient(180deg, #0a1628 0%, #07080c 35%, #07080c 100%);">
    <tr>
      <td align="center" style="padding: 48px 20px;">

        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Brand header -->
          <tr>
            <td class="email-header" align="center" style="padding: 0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <img src="${NI_EMAIL_LOGO_URL}" alt="Northside Intelligence" width="48" height="48" style="display: block; width: 48px; height: 48px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #8b95a8;">
                      Northside Intelligence
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="border-radius: 16px; overflow: hidden; border: 1px solid #1a2a42; background-color: #0d1524; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 212, 255, 0.06);">

              <!-- Cyan accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #00a8cc 0%, #00d4ff 50%, #00a8cc 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-content" style="padding: 36px 40px 32px;">

                    <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #00d4ff;">
                      ${safeEyebrow}
                    </p>

                    <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; line-height: 1.25; color: #ffffff; letter-spacing: -0.02em;">
                      ${safeHeadline}
                    </h1>
                    ${subheadlineBlock}

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 0;">
                      <tr>
                        <td style="border-top: 1px solid #1e2430; font-size: 0; line-height: 0; height: 1px;">&nbsp;</td>
                      </tr>
                    </table>

                    <div style="margin-top: 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #8b95a8;">
                      ${content}
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px 20px 0;">
              ${preferencesBlock}
              ${footerNoteBlock}
              <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #5c6678;">
                <a href="${NI_EMAIL_APP_URL}" style="color: #00d4ff; text-decoration: none;">northsideintelligence.com</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:support@northsideintelligence.com" style="color: #00d4ff; text-decoration: none;">Support</a>
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #3d4555;">
                &copy; ${new Date().getFullYear()} Northside Intelligence. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getNiEmailAppUrl(): string {
  return NI_EMAIL_APP_URL;
}
