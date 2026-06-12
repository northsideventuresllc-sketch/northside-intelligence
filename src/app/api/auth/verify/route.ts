import { NextRequest, NextResponse } from "next/server";
import { verifyViaEdge } from "@/lib/auth/portal-auth-edge";
import { resolvePostAuthRedirect } from "@/lib/ni-auth";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { pendingAuthCookieOptions } from "@/lib/supabase/cookie-domain";

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

  const redirectTo = resolvePostAuthRedirect(returnTo);
  const response = NextResponse.json({ success: true, returnTo: redirectTo });

  const supabase = await createServerAuthClient();
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    return NextResponse.json({ error: "Failed to sign in after verification" }, { status: 500 });
  }

  response.cookies.set(PENDING_COOKIE, "", pendingAuthCookieOptions({ maxAge: 0 }));
  return response;
}
