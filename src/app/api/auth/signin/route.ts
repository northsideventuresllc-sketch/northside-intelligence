import { NextRequest, NextResponse } from "next/server";
import {
  createPendingViaEdge,
  issueOtpViaEdge,
} from "@/lib/auth/portal-auth-edge";
import { resolveIdentifierToEmail } from "@/lib/auth/resolve-identifier";
import { sanitizeReturnTo } from "@/lib/ni-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const PENDING_COOKIE = "ni_auth_pending";
const PENDING_MAX_AGE = 60 * 10;

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

  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.session) {
    return NextResponse.json({ error: "Invalid email, username, or password" }, { status: 401 });
  }

  const returnTo = sanitizeReturnTo(body.returnTo);
  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("ni_portal_profiles")
    .select("two_factor_enabled")
    .eq("id", data.user.id)
    .maybeSingle();

  const twoFactorEnabled = profile?.two_factor_enabled ?? true;

  if (!twoFactorEnabled) {
    const response = NextResponse.json({
      success: true,
      direct: true,
      returnTo: returnTo ?? "/",
    });
    return response;
  }

  await supabase.auth.signOut();

  try {
    await issueOtpViaEdge({
      email,
      purpose: "signin",
      metadata: { userId: data.user.id },
    });
    const { pendingId } = await createPendingViaEdge({
      email,
      password,
      flow: "signin",
      returnTo,
      metadata: { userId: data.user.id },
    });

    const response = NextResponse.json({ step: "verify", email });
    response.cookies.set(PENDING_COOKIE, pendingId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PENDING_MAX_AGE,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send verification email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
