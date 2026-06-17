import { NextRequest, NextResponse } from "next/server";
import {
  getUserStorePreferences,
  setWebTrackingEnabled,
} from "@/lib/store/personalization/preferences";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const prefs = await getUserStorePreferences(user.id);
    return NextResponse.json({
      webTrackingEnabled: prefs?.webTrackingEnabled ?? false,
      interestTags: prefs?.interestTags ?? [],
    });
  } catch (err) {
    console.error("[store/preferences GET]", err);
    return NextResponse.json({ error: "Unable to load preferences." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { webTrackingEnabled?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.webTrackingEnabled !== "boolean") {
    return NextResponse.json({ error: "webTrackingEnabled is required" }, { status: 400 });
  }

  try {
    const prefs = await setWebTrackingEnabled(user.id, body.webTrackingEnabled);
    return NextResponse.json({
      webTrackingEnabled: prefs.webTrackingEnabled,
      interestTags: prefs.interestTags,
    });
  } catch (err) {
    console.error("[store/preferences POST]", err);
    return NextResponse.json({ error: "Unable to save preferences." }, { status: 500 });
  }
}
