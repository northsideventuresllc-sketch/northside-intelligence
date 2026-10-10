import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/account/delete
 * Soft-deletes the account: the profile row is retained (marked deleted)
 * so the email can never claim another free trial. Trial codes stay
 * permanently assigned to the (deleted) account.
 */
export async function POST(_req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const admin = createServiceClient();

    // Ensure any trial code ever issued has the email recorded (anti-abuse)
    const normalizedEmail = user.email?.trim().toLowerCase() ?? "";
    if (normalizedEmail) {
      const { data: codes } = await admin
        .from("trial_codes")
        .select("id, metadata")
        .eq("user_id", user.id);
      for (const c of codes ?? []) {
        const meta = (c.metadata ?? {}) as Record<string, unknown>;
        if (!meta.email) {
          await admin
            .from("trial_codes")
            .update({ metadata: { ...meta, email: normalizedEmail } })
            .eq("id", c.id);
        }
      }
    }

    // Soft-delete: keep the row, mark as deleted. Never hard-delete:
    // the email must remain on record to block repeat free trials.
    await admin
      .from("ni_portal_profiles")
      .update({ account_type: "deleted", updated_at: new Date().toISOString() })
      .eq("id", user.id);

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
