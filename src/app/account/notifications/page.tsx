import type { Metadata } from "next";
import { NotificationSettingsClient } from "@/components/account/NotificationSettingsClient";

export const metadata: Metadata = {
  title: "Notification Settings | Northside Intelligence",
};

export default function AccountNotificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Notifications</h1>
      <p className="mt-1 text-sm text-ni-muted">
        Manage in-app and email notification preferences.
      </p>
      <div className="mt-6">
        <NotificationSettingsClient />
      </div>
    </div>
  );
}
