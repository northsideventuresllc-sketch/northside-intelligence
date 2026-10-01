import { NextRequest, NextResponse } from "next/server";
import { processItFeedback, type ItFeedbackSubmission } from "@/lib/feedback/bug-pipeline";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const toolSlug = typeof body.toolSlug === "string" ? body.toolSlug.trim() : "general";
    const type = (body.type as "feedback" | "bug_report" | "feature_request") || "feedback";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "User Feedback";
    const details = typeof body.details === "string" ? body.details.trim() : "";

    if (!details) {
      return NextResponse.json({ error: "Feedback or bug details are required." }, { status: 400 });
    }

    const submission: ItFeedbackSubmission = {
      toolSlug,
      userId: user?.id,
      userEmail: user?.email,
      type,
      subject,
      details,
      systemContext: typeof body.systemContext === "object" ? body.systemContext : undefined,
    };

    const result = await processItFeedback(submission);

    return NextResponse.json({
      success: true,
      reportId: result.reportId,
      status: result.status,
      message:
        type === "bug_report"
          ? "Bug report received. Our autonomous repair pipeline is analyzing the issue now."
          : "Thank you for your feedback! It has been logged for our product team.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
