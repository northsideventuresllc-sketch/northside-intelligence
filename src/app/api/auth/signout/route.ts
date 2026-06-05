import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerAuthClient } from "@/lib/supabase/route-handler-auth";

export async function POST(request: NextRequest) {
  const { supabase, applyAuthCookiesTo } = createRouteHandlerAuthClient(request);
  await supabase.auth.signOut();
  const response = NextResponse.json({ success: true });
  return applyAuthCookiesTo(response);
}
