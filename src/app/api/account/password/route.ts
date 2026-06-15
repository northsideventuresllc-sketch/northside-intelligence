import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordWithServiceRole } from "@/lib/auth/verify-password";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

interface PasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PasswordBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const verified = await verifyPasswordWithServiceRole(user.email, currentPassword);
  if (!verified) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update password" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
