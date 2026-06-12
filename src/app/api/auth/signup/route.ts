import { NextRequest, NextResponse } from "next/server";
import {
  createPendingViaEdge,
  issueOtpViaEdge,
} from "@/lib/auth/portal-auth-edge";
import { ensurePortalProfile } from "@/lib/auth/ensure-portal-profile";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import { sanitizeReturnTo } from "@/lib/ni-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { pendingAuthCookieOptions } from "@/lib/supabase/cookie-domain";

const PENDING_COOKIE = "ni_auth_pending";

interface SignupBody {
  email?: string;
  password?: string;
  fullName?: string;
  username?: string;
  twoFactorEnabled?: boolean;
  returnTo?: string;
}

export async function POST(request: NextRequest) {
  let body: SignupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.fullName?.trim() || null;
  const username = body.username ? normalizeUsername(body.username) : null;
  const twoFactorEnabled = body.twoFactorEnabled !== false;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (username && !isValidUsername(username)) {
    return NextResponse.json(
      { error: "Username must be 3–30 characters (letters, numbers, underscores)" },
      { status: 400 }
    );
  }

  if (username) {
    const admin = createServiceClient();
    const { data: existing } = await admin
      .from("ni_portal_profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
  }

  const admin = createServiceClient();
  const { data: emailExists, error: emailCheckError } = await admin.rpc(
    "ni_auth_email_exists",
    { check_email: email }
  );

  if (emailCheckError) {
    console.error("Email existence check failed:", emailCheckError.message);
  } else if (emailExists) {
    return NextResponse.json(
      { error: "An account with this email already exists. Sign in instead." },
      { status: 409 }
    );
  }

  const returnTo = sanitizeReturnTo(body.returnTo);

  try {
    await issueOtpViaEdge({ email, purpose: "signup" });
    const { pendingId } = await createPendingViaEdge({
      email,
      password,
      flow: "signup",
      fullName,
      returnTo,
      metadata: { username, twoFactorEnabled },
    });

    const response = NextResponse.json({ step: "verify", email, pendingId });
    response.cookies.set(PENDING_COOKIE, pendingId, pendingAuthCookieOptions());

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send verification email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
