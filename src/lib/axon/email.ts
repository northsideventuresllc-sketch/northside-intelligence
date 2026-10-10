import { Resend } from "resend";
import { renderAxonAccessCodeEmail } from "@/lib/emails/templates/axon-access-code";
import { PORTAL_URL } from "@/lib/sector3-registry";

// Resolved lazily at send time (not module load) so DB-hydrated secrets
// (hydratePlatformEnvFromDatabase, e.g. RESEND_API_KEY_NI) take effect even
// when this module was imported before hydration ran.
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  return apiKey ? new Resend(apiKey) : null;
}

function getAxonFromEmail(): string {
  return (
    process.env.AXON_FROM_EMAIL?.trim() ??
    "Northside Intelligence <noreply@northsideintelligence.com>"
  );
}

export async function sendAxonAccessCodeEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}): Promise<{ error?: string }> {
  const resend = getResendClient();
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] AXON access code for ${to}: ${code}`);
      return {};
    }
    return { error: "Email service not configured (RESEND_API_KEY)" };
  }

  const html = renderAxonAccessCodeEmail({
    code,
    portalUrl: `${PORTAL_URL}/axon`,
  });

  const { error } = await resend.emails.send(
    {
      from: getAxonFromEmail(),
      to: [to],
      subject: "Your AXON access code",
      html,
    },
    { idempotencyKey: `axon-access/${to.toLowerCase()}/${Date.now()}` }
  );

  if (error) return { error: error.message };
  return {};
}
