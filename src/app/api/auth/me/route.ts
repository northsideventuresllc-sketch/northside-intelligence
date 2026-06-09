import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function GET() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("full_name, email, username, two_factor_enabled")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      username: profile?.username ?? null,
      twoFactorEnabled: profile?.two_factor_enabled ?? true,
    },
  });
}
