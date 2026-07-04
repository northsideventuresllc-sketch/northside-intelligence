import { Resend } from "resend";
import { renderAxonAccessCodeEmail } from "@/lib/emails/templates/axon-access-code";
import { PORTAL_URL } from "@/lib/sector3-registry";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const AXON_FROM =
  process.env.AXON_FROM_EMAIL?.trim() ??
  "Northside Intelligence <noreply@northsideintelligence.com>";

export async function sendAxonAccessCodeEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}): Promise<{ error?: string }> {
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
      from: AXON_FROM,
      to: [to],
      subject: "Your AXON access code",
      html,
    },
    { idempotencyKey: `axon-access/${to.toLowerCase()}/${Date.now()}` }
  );

  if (error) return { error: error.message };
  return {};
}
