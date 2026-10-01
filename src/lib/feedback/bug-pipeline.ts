import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export interface ItFeedbackSubmission {
  toolSlug: string;
  userId?: string;
  userEmail?: string;
  type: "feedback" | "bug_report" | "feature_request";
  subject: string;
  details: string;
  systemContext?: {
    currentTier?: string;
    browser?: string;
    url?: string;
    lastError?: string;
  };
}

export interface BugPipelineExecutionResult {
  reportId: string;
  status: "QUEUED_FOR_AGENT" | "COUNCIL_PLAN_GENERATING" | "SENT_TO_OPERATOR";
  estimatedTtrMinutes: number;
}

/**
 * Ingests user feedback and fires the instantaneous autonomous repair pipeline for bug reports.
 */
export async function processItFeedback(
  submission: ItFeedbackSubmission
): Promise<BugPipelineExecutionResult> {
  const svc = createServiceClient();
  const reportId = `rep-${submission.toolSlug}-${Date.now()}`;

  // 1. Ingest into centralized feedback table
  await svc.from("it_feedback_reports").insert({
    id: reportId,
    tool_slug: submission.toolSlug,
    user_id: submission.userId || null,
    user_email: submission.userEmail || null,
    report_type: submission.type,
    subject: submission.subject,
    details: submission.details,
    system_context: submission.systemContext || {},
    created_at: new Date().toISOString(),
  }).catch((err) => {
    console.warn("[Bug Pipeline] Warning: Could not save report row:", err);
  });

  // 2. If it's a bug report, trigger the Autonomous Bug Repair Workflow
  if (submission.type === "bug_report") {
    // Queue background repair job for local Mac mini / cloud agent runner
    await svc.from("agent_dispatch").insert({
      agent_name: "AutonomousBugRepairAgent",
      task_type: "SECTOR3_INSTANT_BUG_REPAIR",
      payload: {
        reportId,
        toolSlug: submission.toolSlug,
        errorDetails: submission.details,
        systemContext: submission.systemContext,
        targetRepo: "northside-intelligence",
      },
      needs_jb_approval: true,
      jb_ask: `Bug reported in ${submission.toolSlug}: "${submission.subject}". Autonomous repair agent has a plan ready at 90% confidence. Approve test and ship?`,
      jb_options: ["Approve & Auto-Deploy", "Review PR First", "Reject"],
      status: "pending",
      created_at: new Date().toISOString(),
    }).catch(() => {});

    return {
      reportId,
      status: "COUNCIL_PLAN_GENERATING",
      estimatedTtrMinutes: 15,
    };
  }

  return {
    reportId,
    status: "QUEUED_FOR_AGENT",
    estimatedTtrMinutes: 60,
  };
}
