import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    // fall through to validation
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("axon_waitlist")
      .insert({ email, source: "axon_page" });

    // 23505 = unique violation — already on the list, treat as success
    if (error && error.code !== "23505") {
      console.error("axon waitlist insert failed:", error.message);
      return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "You are on the AXON waitlist." });
  } catch (err) {
    console.error("axon waitlist error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
