import { NextRequest, NextResponse } from "next/server";
import { canEnterAxonPortal, ensureMasterAxonAccess } from "@/lib/axon/access";
import { readAxonSessionFromRequest } from "@/lib/axon/session";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  await ensureMasterAxonAccess(user.id);

  const unlocked = readAxonSessionFromRequest(request, user.id);

  return NextResponse.json({
    allowed: true,
    unlocked,
    hasAccessCode: true,
  });
}
