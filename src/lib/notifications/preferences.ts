import "server-only";

import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  type NotificationPreference,
} from "./types";
import { createServiceClient } from "@/lib/supabase/server";

export async function ensureNotificationPreferences(userId: string): Promise<void> {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  const rows = NOTIFICATION_CATEGORIES.map((category) => ({
    user_id: userId,
    category,
    in_app_enabled: true,
    email_enabled: true,
    updated_at: now,
  }));

  await admin
    .from("ni_notification_preferences")
    .upsert(rows, { onConflict: "user_id,category", ignoreDuplicates: true });
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreference[]> {
  await ensureNotificationPreferences(userId);

  const admin = createServiceClient();
  const { data } = await admin
    .from("ni_notification_preferences")
    .select("category, in_app_enabled, email_enabled")
    .eq("user_id", userId);

  const map = new Map<string, NotificationPreference>();
  for (const row of data ?? []) {
    map.set(row.category, {
      category: row.category as NotificationCategory,
      inAppEnabled: row.in_app_enabled,
      emailEnabled: row.email_enabled,
    });
  }

  return NOTIFICATION_CATEGORIES.map(
    (category) =>
      map.get(category) ?? {
        category,
        inAppEnabled: true,
        emailEnabled: true,
      }
  );
}

export async function updateNotificationPreference(
  userId: string,
  category: NotificationCategory,
  updates: { inAppEnabled?: boolean; emailEnabled?: boolean }
): Promise<void> {
  const admin = createServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.inAppEnabled !== undefined) patch.in_app_enabled = updates.inAppEnabled;
  if (updates.emailEnabled !== undefined) patch.email_enabled = updates.emailEnabled;

  await admin
    .from("ni_notification_preferences")
    .upsert({ user_id: userId, category, ...patch }, { onConflict: "user_id,category" });
}

export async function isEmailEnabledForCategory(
  userId: string,
  category: NotificationCategory
): Promise<boolean> {
  const prefs = await getNotificationPreferences(userId);
  return prefs.find((p) => p.category === category)?.emailEnabled ?? true;
}
