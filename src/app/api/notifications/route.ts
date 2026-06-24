import { NextRequest, NextResponse } from "next/server";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/service";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function GET() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    listNotifications(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { notificationId?: string; markAllRead?: boolean };
  try {
    body = (await req.json()) as { notificationId?: string; markAllRead?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.markAllRead) {
    await markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  }

  if (!body.notificationId) {
    return NextResponse.json({ error: "notificationId required" }, { status: 400 });
  }

  const ok = await markNotificationRead(user.id, body.notificationId);
  if (!ok) {
    return NextResponse.json({ error: "Could not mark notification read" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
