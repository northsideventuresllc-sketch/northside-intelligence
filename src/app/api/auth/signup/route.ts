import { NextRequest, NextResponse } from "next/server";
import { encryptPayload } from "@/lib/auth/crypto";
import { issueOtp } from "@/lib/auth/otp";
import { sanitizeReturnTo } from "@/lib/ni-auth";

const PENDING_COOKIE = "ni_auth_pending";
const PENDING_MAX_AGE = 60 * 10;

interface SignupBody {
  email?: string;
  password?: string;
  fullName?: string;
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

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    await issueOtp({ email, purpose: "signup" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send verification email";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const returnTo = sanitizeReturnTo(body.returnTo);

  const response = NextResponse.json({ step: "verify", email });
  response.cookies.set(
    PENDING_COOKIE,
    encryptPayload({ email, password, fullName, flow: "signup", returnTo }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PENDING_MAX_AGE,
    }
  );

  return response;
}
