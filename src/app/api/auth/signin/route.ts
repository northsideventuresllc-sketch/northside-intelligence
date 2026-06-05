import { NextRequest, NextResponse } from "next/server";
import {
  createPendingViaEdge,
  issueOtpViaEdge,
} from "@/lib/auth/portal-auth-edge";
import { sanitizeReturnTo } from "@/lib/ni-auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const PENDING_COOKIE = "ni_auth_pending";
const PENDING_MAX_AGE = 60 * 10;

interface SigninBody {
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

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await supabase.auth.signOut();

  const returnTo = sanitizeReturnTo(body.returnTo);

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
