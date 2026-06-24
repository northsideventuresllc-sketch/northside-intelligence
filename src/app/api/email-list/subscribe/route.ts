import { NextRequest, NextResponse } from "next/server";
import { subscribeUserToEmailList } from "@/lib/email/subscribe-list";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { firstName?: string } = {};
  try {
    body = (await req.json()) as { firstName?: string };
  } catch {
    // optional body
  }

  const result = await subscribeUserToEmailList(
    user.id,
    user.email,
    body.firstName ?? user.user_metadata?.full_name
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    subscribed: result.subscribed,
    kitSubscriberId: result.kitSubscriberId,
  });
}

export async function GET() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ subscribed: false }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("ni_portal_profiles")
    .select("email_list_subscribed, email_list_subscribed_at")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    subscribed: profile?.email_list_subscribed === true,
    subscribedAt: profile?.email_list_subscribed_at ?? null,
  });
}
