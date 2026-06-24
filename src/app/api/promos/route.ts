import { NextResponse } from "next/server";
import { isUserOnEmailList } from "@/lib/email/subscribe-list";
import { listActivePromosForUser } from "@/lib/promos/generate";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function GET() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const onEmailList = await isUserOnEmailList(user.id);

  if (!onEmailList) {
    return NextResponse.json({
      emailListRequired: true,
      promos: [],
    });
  }

  const promos = await listActivePromosForUser(user.id);

  return NextResponse.json({
    emailListRequired: false,
    promos,
  });
}
