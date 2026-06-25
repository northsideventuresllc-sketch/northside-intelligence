const NI_EMAIL_APP_URL = "https://www.northsideintelligence.com";
const NI_EMAIL_LOGO_URL = `${NI_EMAIL_APP_URL}/ni-emblem.svg`;

interface NiEmailLayoutOptions {
  preheader?: string;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  content: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function niEmailCodeDisplay(code: string): string {
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

export function wrapNiEmailHtml(options: NiEmailLayoutOptions): string {
  const {
    preheader = "",
    eyebrow = "Northside Intelligence",
    headline,
    subheadline,
    content,
  } = options;

  const safePreheader = escapeHtml(preheader || headline);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeHeadline = escapeHtml(headline);
  const safeSubheadline = subheadline ? escapeHtml(subheadline) : "";

  const subheadlineBlock = safeSubheadline
    ? `<p style="margin: 8px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #8b95a8;">${safeSubheadline}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <title>${safeHeadline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07080c; width: 100% !important;">
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #07080c;">
    ${safePreheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #07080c; background-image: linear-gradient(180deg, #0a1628 0%, #07080c 35%, #07080c 100%);">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding: 0 0 32px;">
              <img src="${NI_EMAIL_LOGO_URL}" alt="Northside Intelligence" width="48" height="48" style="display: block; width: 48px; height: 48px; margin: 0 auto 12px;" />
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #8b95a8;">Northside Intelligence</span>
            </td>
          </tr>
          <tr>
            <td style="border-radius: 16px; overflow: hidden; border: 1px solid #1a2a42; background-color: #0d1524; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="4" style="background: linear-gradient(90deg, #00a8cc 0%, #00d4ff 50%, #00a8cc 100%); font-size: 0; line-height: 0;">&nbsp;</td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 36px 40px 32px;">
                    <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #00d4ff;">${safeEyebrow}</p>
                    <h1 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; line-height: 1.25; color: #ffffff;">${safeHeadline}</h1>
                    ${subheadlineBlock}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 0;"><tr><td style="border-top: 1px solid #1e2430; font-size: 0; line-height: 0; height: 1px;">&nbsp;</td></tr></table>
                    <div style="margin-top: 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #8b95a8;">${content}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 32px 20px 0;">
              <p style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #5c6678;">
                <a href="${NI_EMAIL_APP_URL}" style="color: #00d4ff; text-decoration: none;">northsideintelligence.com</a>
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #3d4555;">
                &copy; ${new Date().getFullYear()} Northside Intelligence
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

export function buildOtpEmailHtml(code: string, purpose: "signup" | "signin"): string {
  const action = purpose === "signup" ? "complete your signup" : "sign in securely";

  const content = `
    <p style="margin: 0 0 4px; color: #c5cdd9;">Use this code to ${action}:</p>
    ${niEmailCodeDisplay(code)}
    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #8b95a8;">
      This code expires in 10 minutes. If you didn&rsquo;t request this, you can safely ignore this email.
    </p>`;

  return wrapNiEmailHtml({
    preheader: `Your verification code is ${code}. Expires in 10 minutes.`,
    eyebrow: "Account Security",
    headline: "Verify Your Email",
    content,
  });
}
