import { NextRequest, NextResponse } from "next/server";
import { verifyViaEdge } from "@/lib/auth/portal-auth-edge";
import { resolvePostAuthRedirect } from "@/lib/ni-auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { pendingAuthCookieOptions } from "@/lib/supabase/cookie-domain";
import { createServiceClient } from "@/lib/supabase/server";
import {
  TRIAL_PROMO_START,
  sendWelcomeEmail,
  notifyPortal,
} from "@/lib/billing/trial-flow";

const PENDING_COOKIE = "ni_auth_pending";

interface VerifyBody {
  code?: string;
  pendingId?: string;
}

export async function POST(request: NextRequest) {
  let body: VerifyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const pendingId =
    request.cookies.get(PENDING_COOKIE)?.value ?? body.pendingId?.trim();
  if (!pendingId) {
    return NextResponse.json({ error: "Session expired. Please start again." }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  const result = await verifyViaEdge({ pendingId, code });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.data.error ?? "Invalid or expired verification code" },
      { status: result.status }
    );
  }

  const { accessToken, refreshToken, returnTo } = result.data;
  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: "Failed to sign in after verification" }, { status: 500 });
  }

  const supabase = await createServerAuthClient();
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return NextResponse.json({ error: "Failed to sign in after verification" }, { status: 500 });
  }

  // New signups from the trial promo launch get the trial-code flow,
  // a welcome email, and a portal notification.
  let finalRedirect = resolvePostAuthRedirect(returnTo);
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email && user.created_at) {
      const createdAt = new Date(user.created_at).getTime();
      const isNewSignup = Date.now() - createdAt < 10 * 60 * 1000;
      if (isNewSignup && createdAt >= TRIAL_PROMO_START.getTime()) {
        finalRedirect = "/trial-code";
        const admin = createServiceClient();
        const { data: profile } = await admin
          .from("ni_portal_profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        await sendWelcomeEmail(
          user.email,
          (profile as { full_name?: string } | null)?.full_name ?? null
        );
        await notifyPortal(
          user.id,
          "welcome",
          "Welcome to Northside Intelligence",
          "Your account is ready. Your free 7-day trial code is on its way — check your email.",
          "/trial-code"
        );
      }
    }
  } catch (err) {
    console.error("[verify] trial promo hook failed:", err);
  }

  const finalResponse = NextResponse.json({ success: true, returnTo: finalRedirect });
  finalResponse.cookies.set(PENDING_COOKIE, "", pendingAuthCookieOptions({ maxAge: 0 }));
  return finalResponse;
}
