import { NextRequest, NextResponse } from "next/server";
import { decryptPayload } from "@/lib/auth/crypto";
import { verifyOtp } from "@/lib/auth/otp";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

const PENDING_COOKIE = "ni_auth_pending";

interface PendingSignup {
  flow: "signup";
  email: string;
  password: string;
  fullName: string | null;
}

interface PendingSignin {
  flow: "signin";
  email: string;
  password: string;
}

type PendingPayload = PendingSignup | PendingSignin;

interface VerifyBody {
  code?: string;
}

export async function POST(request: NextRequest) {
  const pendingToken = request.cookies.get(PENDING_COOKIE)?.value;
  if (!pendingToken) {
    return NextResponse.json({ error: "Session expired. Please start again." }, { status: 400 });
  }

  const pending = decryptPayload<PendingPayload>(pendingToken);
  if (!pending?.email || !pending?.password || !pending?.flow) {
    return NextResponse.json({ error: "Invalid session. Please start again." }, { status: 400 });
  }

  let body: VerifyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  const purpose = pending.flow === "signup" ? "signup" : "signin";
  const { valid } = await verifyOtp({ email: pending.email, purpose, code });

  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  if (pending.flow === "signup") {
    const admin = createServiceClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: pending.email,
      password: pending.password,
      email_confirm: true,
      user_metadata: pending.fullName ? { full_name: pending.fullName } : undefined,
    });

    if (createError || !created.user) {
      const duplicate =
        createError?.message?.toLowerCase().includes("already") ||
        createError?.message?.toLowerCase().includes("registered");
      return NextResponse.json(
        {
          error: duplicate
            ? "An account with this email already exists"
            : (createError?.message ?? "Failed to create account"),
        },
        { status: duplicate ? 409 : 500 }
      );
    }

    await admin.from("ni_portal_profiles").upsert({
      id: created.user.id,
      email: pending.email,
      full_name: pending.fullName,
      updated_at: new Date().toISOString(),
    });
  }

  const supabase = await createServerAuthClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: pending.email,
    password: pending.password,
  });

  if (signInError) {
    return NextResponse.json({ error: "Failed to sign in after verification" }, { status: 500 });
  }

  response.cookies.set(PENDING_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
