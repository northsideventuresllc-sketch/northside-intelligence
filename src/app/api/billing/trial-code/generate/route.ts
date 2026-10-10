import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import {
  generateTrialCodeForUser,
  sendTrialCodeEmail,
  notifyPortal,
} from "@/lib/billing/trial-flow";

/**
 * POST /api/billing/trial-code/generate
 * Generates (or returns the existing) 48-hour trial code for the logged-in
 * user, emails it, and creates a portal notification. Idempotent.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { toolSlug?: string };
    const toolSlug = body.toolSlug?.trim().toLowerCase() || "all";

    const result = await generateTrialCodeForUser(user.id, user.email, toolSlug);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.isNew) {
      await sendTrialCodeEmail(user.email, result.code, result.expiresAt);
      await notifyPortal(
        user.id,
        "trial_code",
        "Your free trial code is ready",
        `Your trial code was sent to ${user.email}. Enter it within 48 hours to start your 7-day free trial.`,
        "/trial-code"
      );
    }

    return NextResponse.json({
      code: result.code,
      expiresAt: result.expiresAt,
      isNew: result.isNew,
      emailSent: result.isNew,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
