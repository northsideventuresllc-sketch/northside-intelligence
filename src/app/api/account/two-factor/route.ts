import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface TwoFactorBody {
  enabled?: boolean;
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TwoFactorBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const enabled = body.enabled !== false;
  const admin = createServiceClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("ni_portal_profiles")
    .update({ two_factor_enabled: enabled, updated_at: now })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }

  return NextResponse.json({ success: true, enabled });
}
