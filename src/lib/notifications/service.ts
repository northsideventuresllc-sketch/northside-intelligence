import "server-only";

import { buildNiEmailHtml, sendNoreplyEmail } from "@/lib/email/noreply";
import { isEmailEnabledForCategory } from "@/lib/notifications/preferences";
import type { NotificationCategory, NiNotification } from "@/lib/notifications/types";
import { createServiceClient } from "@/lib/supabase/server";

export interface CreateNotificationInput {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
  sendEmail?: boolean;
  userEmail?: string | null;
}

function mapRow(row: Record<string, unknown>): NiNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    category: row.category as NotificationCategory,
    title: String(row.title),
    body: String(row.body),
    link: row.link ? String(row.link) : null,
    readAt: row.read_at ? String(row.read_at) : null,
    emailSentAt: row.email_sent_at ? String(row.email_sent_at) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<NiNotification | null> {
  const admin = createServiceClient();

  const { data, error } = await admin
    .from("ni_notifications")
    .insert({
      user_id: input.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[notifications/create]", error?.message);
    return null;
  }

  const notification = mapRow(data as Record<string, unknown>);

  if (input.sendEmail !== false && input.userEmail) {
    const emailEnabled = await isEmailEnabledForCategory(input.userId, input.category);
    if (emailEnabled) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.northsideintelligence.com";
      const emailResult = await sendNoreplyEmail({
        to: input.userEmail,
        subject: input.title,
        html: buildNiEmailHtml({
          title: input.title,
          body: input.body,
          ctaLabel: input.link ? "View Details" : undefined,
          ctaHref: input.link ? `${appUrl}${input.link}` : undefined,
        }),
        idempotencyKey: `notification/${notification.id}`,
      });

      if (!emailResult.error) {
        await admin
          .from("ni_notifications")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", notification.id);
      }
    }
  }

  return notification;
}

export async function listNotifications(
  userId: string,
  limit = 30
): Promise<NiNotification[]> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("ni_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const admin = createServiceClient();
  const { count } = await admin
    .from("ni_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const admin = createServiceClient();
  const { error } = await admin
    .from("ni_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const admin = createServiceClient();
  await admin
    .from("ni_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
