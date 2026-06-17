import { NextResponse } from "next/server";
import { getViralPicksForUser } from "@/lib/store/viral/picks";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const result = await getViralPicksForUser(user?.id ?? null);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[store/viral]", err);
    return NextResponse.json({ error: "Unable to load viral picks." }, { status: 500 });
  }
}
