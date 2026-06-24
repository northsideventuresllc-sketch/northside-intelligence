import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/notifications/preferences";
import type { NotificationCategory } from "@/lib/notifications/types";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications/types";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function GET() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await getNotificationPreferences(user.id);
  return NextResponse.json({ preferences });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    category?: string;
    inAppEnabled?: boolean;
    emailEnabled?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.category || !NOTIFICATION_CATEGORIES.includes(body.category as NotificationCategory)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  await updateNotificationPreference(user.id, body.category as NotificationCategory, {
    inAppEnabled: body.inAppEnabled,
    emailEnabled: body.emailEnabled,
  });

  const preferences = await getNotificationPreferences(user.id);
  return NextResponse.json({ preferences });
}
