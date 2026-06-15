import { NextRequest, NextResponse } from "next/server";
import {
  createPendingViaEdge,
  issueOtpViaEdge,
} from "@/lib/auth/portal-auth-edge";
import { ensurePortalProfile } from "@/lib/auth/ensure-portal-profile";
import { resolveIdentifierToEmail } from "@/lib/auth/resolve-identifier";
import { verifyPasswordWithServiceRole } from "@/lib/auth/verify-password";
import { sanitizeReturnTo } from "@/lib/ni-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { pendingAuthCookieOptions } from "@/lib/supabase/cookie-domain";

const PENDING_COOKIE = "ni_auth_pending";

interface SigninBody {
  identifier?: string;
  email?: string;
  password?: string;
  returnTo?: string;
}

export async function POST(request: NextRequest) {
  let body: SigninBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const rawIdentifier = body.identifier?.trim() || body.email?.trim();
  const password = body.password;

  if (!rawIdentifier || !password) {
    return NextResponse.json(
      { error: "Email or username and password are required" },
      { status: 400 }
    );
  }

  const email = await resolveIdentifierToEmail(rawIdentifier);
  if (!email) {
    return NextResponse.json({ error: "Invalid email, username, or password" }, { status: 401 });
  }

  const authResult = await verifyPasswordWithServiceRole(email, password);
  if (!authResult) {
    return NextResponse.json({ error: "Invalid email, username, or password" }, { status: 401 });
  }

  const { user, session } = authResult;
  const returnTo = sanitizeReturnTo(body.returnTo);
  const admin = createServiceClient();

  await ensurePortalProfile(admin, user);

  const { data: profile } = await admin
    .from("ni_portal_profiles")
    .select("two_factor_enabled")
    .eq("id", user.id)
    .maybeSingle();

  const twoFactorEnabled = profile?.two_factor_enabled ?? true;

  if (!twoFactorEnabled) {
    const supabase = await createServerAuthClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (sessionError) {
      return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      direct: true,
      returnTo: returnTo ?? "/",
    });
  }

  try {
    await issueOtpViaEdge({
      email,
      purpose: "signin",
      metadata: { userId: user.id },
    });
    const { pendingId } = await createPendingViaEdge({
      email,
      password,
      flow: "signin",
      returnTo,
      metadata: { userId: user.id },
    });

    const response = NextResponse.json({ step: "verify", email, pendingId });
    response.cookies.set(PENDING_COOKIE, pendingId, pendingAuthCookieOptions());

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send verification email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
