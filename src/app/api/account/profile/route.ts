import { NextRequest, NextResponse } from "next/server";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";
import { createServiceClient } from "@/lib/supabase/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface ProfileBody {
  fullName?: string;
  username?: string;
  email?: string;
  accountType?: "personal" | "business";
  businessName?: string | null;
  businessWebsite?: string | null;
  businessSize?: string | null;
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
  const accountType = body.accountType;
  const businessName = body.businessName?.trim() || null;
  const businessWebsite = body.businessWebsite?.trim() || null;
  const businessSize = body.businessSize?.trim() || null;

  if (accountType && accountType !== "personal" && accountType !== "business") {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  if (accountType === "business" && body.businessName !== undefined && !businessName) {
    return NextResponse.json({ error: "Business name is required for business accounts" }, { status: 400 });
  }

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
  const profileUpdate: Record<string, string | null> = {
    email: email ?? user.email ?? "",
    updated_at: now,
  };

  if (body.fullName !== undefined) profileUpdate.full_name = fullName;
  if (body.username !== undefined) profileUpdate.username = username || null;
  if (accountType) profileUpdate.account_type = accountType;
  if (body.businessName !== undefined) profileUpdate.business_name = businessName;
  if (body.businessWebsite !== undefined) profileUpdate.business_website = businessWebsite;
  if (body.businessSize !== undefined) profileUpdate.business_size = businessSize;

  const { error: profileError } = await admin
    .from("ni_portal_profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email: email ?? user.email,
  });
}
