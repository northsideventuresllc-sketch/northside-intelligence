import { NextRequest, NextResponse } from "next/server";
import { compileExecutiveSignalBriefing } from "@/lib/signaldesk/briefing";
import { dispatchBriefingEmail } from "@/lib/signaldesk/delivery";
import { getUserBillingState, userCanUseTool } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingState = await getUserBillingState(user.id);
    if (!userCanUseTool(billingState, "signaldesk")) {
      return NextResponse.json(
        { error: "Add Signal Desk to your Toolkit to access competitive intelligence scanning." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const category = typeof body.category === "string" ? body.category.trim() : "Technology & AI";
    const keywords = Array.isArray(body.keywords)
      ? body.keywords.map(String)
      : typeof body.keywords === "string"
      ? body.keywords.split(",").map((s: string) => s.trim())
      : [category];
    const competitorUrls = Array.isArray(body.competitorUrls) ? body.competitorUrls.map(String) : [];
    const dispatchEmail = Boolean(body.dispatchEmail);

    // Compile live executive signal briefing
    const briefing = await compileExecutiveSignalBriefing({
      category,
      keywords,
      competitorUrls,
    });

    let emailStatus = undefined;
    if (dispatchEmail && user.email) {
      emailStatus = await dispatchBriefingEmail({
        recipientEmail: user.email,
        briefing,
      });
    }

    // Persist briefing in user's saved intelligence reports
    try {
      const svc = createServiceClient();
      await svc.from("signaldesk_reports").insert({
        user_id: user.id,
        category,
        threat_level: briefing.threatLevel,
        executive_summary: briefing.executiveSummary,
        report_data: briefing,
        created_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      briefing,
      emailDispatched: emailStatus?.success ?? false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
