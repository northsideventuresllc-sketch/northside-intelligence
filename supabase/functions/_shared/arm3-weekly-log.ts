import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export interface WeeklyLogInput {
  logType: string;
  toolSlug?: string | null;
  summary: string;
  detail?: Record<string, unknown>;
  actionRequired?: boolean;
  actionFor?: string | null;
}

export function weekOfDate(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export async function logArm3Weekly(
  supabase: SupabaseClient,
  input: WeeklyLogInput
): Promise<void> {
  const { error } = await supabase.from("arm3_weekly_logs").insert({
    week_of: weekOfDate(),
    log_type: input.logType,
    tool_slug: input.toolSlug ?? null,
    summary: input.summary,
    detail: input.detail ?? null,
    action_required: input.actionRequired ?? false,
    action_for: input.actionFor ?? null,
  });

  if (error) {
    console.error("arm3_weekly_logs insert failed:", error.message);
  }
}
