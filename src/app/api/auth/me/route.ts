import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerAuthClient } from "@/lib/supabase/route-handler-auth";

export async function GET(request: NextRequest) {
  const { supabase, applyAuthCookiesTo } = createRouteHandlerAuthClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const response = NextResponse.json({ user: null });
    return applyAuthCookiesTo(response);
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    },
  });
  return applyAuthCookiesTo(response);
}
