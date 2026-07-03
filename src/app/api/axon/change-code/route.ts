import { NextRequest, NextResponse } from "next/server";
import { canAccessAxon, changeUserAxonCode } from "@/lib/axon/access";
import { readAxonSessionFromRequest } from "@/lib/axon/session";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!readAxonSessionFromRequest(request, user.id)) {
    return NextResponse.json({ error: "AXON session required." }, { status: 401 });
  }

  const allowed = await canAccessAxon(user.id);
  if (!allowed) {
    return NextResponse.json({ error: "AXON is not available for this account." }, { status: 403 });
  }

  let body: { currentCode?: string; newCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const currentCode = body.currentCode?.trim() ?? "";
  const newCode = body.newCode?.trim() ?? "";
  if (!currentCode || !newCode) {
    return NextResponse.json({ error: "Current and new codes are required." }, { status: 400 });
  }

  const result = await changeUserAxonCode(user.id, currentCode, newCode);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
