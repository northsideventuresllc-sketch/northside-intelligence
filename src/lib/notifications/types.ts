export const NOTIFICATION_CATEGORIES = [
  "store_order",
  "promo",
  "usage_limit",
  "announcement",
  "billing",
  "general",
  "price_alert",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export interface NiNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  emailSentAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreference {
  category: NotificationCategory;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  store_order: "Smart Store Orders",
  promo: "Promos & Deals",
  usage_limit: "Usage Limits",
  announcement: "Announcements",
  billing: "Billing",
  general: "General",
  price_alert: "Price Alerts",
};
