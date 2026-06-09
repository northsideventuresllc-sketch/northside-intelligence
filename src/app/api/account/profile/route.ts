import { NextRequest, NextResponse } from "next/server";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface ProfileBody {
  fullName?: string;
  username?: string;
  email?: string;
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProfileBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const fullName = body.fullName?.trim() || null;
  const username = body.username ? normalizeUsername(body.username) : null;
  const email = body.email?.trim().toLowerCase();

  if (username && !isValidUsername(username)) {
    return NextResponse.json(
      { error: "Username must be 3–30 characters (letters, numbers, underscores)" },
      { status: 400 }
    );
  }

  const admin = createServiceClient();

  if (username) {
    const { data: taken } = await admin
      .from("ni_portal_profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();

    if (taken) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
  }

  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) {
      return NextResponse.json(
        { error: emailError.message ?? "Failed to update email" },
        { status: 400 }
      );
    }
  }

  const now = new Date().toISOString();
  const { error: profileError } = await admin
    .from("ni_portal_profiles")
    .update({
      email: email ?? user.email ?? "",
      full_name: fullName,
      username: username || null,
      updated_at: now,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email: email ?? user.email,
  });
}
