import { NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST() {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
