import { NextRequest, NextResponse } from "next/server";
import { canEnterAxonPortal, verifyUserAxonCode } from "@/lib/axon/access";
import { setAxonSessionCookie } from "@/lib/axon/session";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const allowed = await canEnterAxonPortal(user.id);
  if (!allowed) {
    return NextResponse.json({ error: "AXON is not available for this account." }, { status: 403 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Access code is required." }, { status: 400 });
  }

  const valid = await verifyUserAxonCode(user.id, code);
  if (!valid) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  setAxonSessionCookie(response, user.id);
  return response;
}
