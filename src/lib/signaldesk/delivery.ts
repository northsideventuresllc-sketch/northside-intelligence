import "server-only";
import { type SignalBriefingReport } from "@/lib/signaldesk/briefing";

/**
 * Formats and dispatches an executive signal briefing via Resend email.
 */
export async function dispatchBriefingEmail(params: {
  recipientEmail: string;
  recipientName?: string;
  briefing: SignalBriefingReport;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { recipientEmail, recipientName, briefing } = params;

  try {
    const { getResendClient } = await import("@/lib/resend");
    const resend = getResendClient();

    if (!resend) {
      // Return simulated success in development or when Resend key is not configured
      return { success: true, messageId: "simulated-dispatch-" + Date.now() };
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
        <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">Signal Desk · Executive Intelligence</h1>
          <p style="font-size: 13px; color: #666; margin: 4px 0 0 0;">Sector: <strong>${briefing.category}</strong> | Threat Assessment: <strong>${briefing.threatLevel}</strong></p>
        </div>

        <div style="background-color: #f7f7f7; border-left: 4px solid #000; padding: 14px 16px; margin-bottom: 24px;">
          <h3 style="font-size: 13px; text-transform: uppercase; margin: 0 0 6px 0; color: #444;">Executive Bottom Line</h3>
          <p style="font-size: 14px; line-height: 1.5; margin: 0;">${briefing.executiveSummary}</p>
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; margin: 20px 0 10px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px;">Top Strategic Signals</h3>
        ${briefing.highPrioritySignals
          .slice(0, 3)
          .map(
            (s) => `
            <div style="margin-bottom: 16px;">
              <h4 style="font-size: 14px; margin: 0 0 4px 0;"><a href="${s.sourceUrl}" style="color: #0066cc; text-decoration: none;">${s.title}</a></h4>
              <p style="font-size: 13px; color: #444; margin: 0 0 4px 0;"><strong>Impact:</strong> ${s.impact}</p>
              <p style="font-size: 13px; color: #008800; margin: 0;"><strong>Tactical Action:</strong> ${s.actionItem}</p>
            </div>
          `
          )
          .join("")}

        <div style="margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 14px; font-size: 12px; color: #888;">
          <p style="margin: 0;">Dispatched automatically by Northside Intelligence Signal Desk.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "Signal Desk <intel@northsideintelligence.com>",
      to: recipientEmail,
      subject: `[Signal Desk] ${briefing.category} Intelligence Briefing (${briefing.threatLevel})`,
      html: htmlContent,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email briefing",
    };
  }
}
