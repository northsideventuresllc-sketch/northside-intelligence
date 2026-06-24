"use client";

import { useCallback, useEffect, useState } from "react";
import {
  NOTIFICATION_CATEGORY_LABELS,
  type NotificationCategory,
  type NotificationPreference,
} from "@/lib/notifications/types";

export function NotificationSettingsClient() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) return;
      const data = (await res.json()) as { preferences: NotificationPreference[] };
      setPreferences(data.preferences);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePref(
    category: NotificationCategory,
    field: "inAppEnabled" | "emailEnabled",
    value: boolean
  ) {
    setSaving(category);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, [field]: value }),
      });
      if (res.ok) {
        const data = (await res.json()) as { preferences: NotificationPreference[] };
        setPreferences(data.preferences);
      }
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return <p className="text-ni-muted">Loading preferences…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ni-muted">
        Choose how you receive updates. In-app notifications appear in the header bell.
        Email notifications are sent from noreply@northsideintelligence.com.
      </p>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left font-medium text-white">Category</th>
              <th className="px-4 py-3 text-center font-medium text-white">In-App</th>
              <th className="px-4 py-3 text-center font-medium text-white">Email</th>
            </tr>
          </thead>
          <tbody>
            {preferences.map((pref) => (
              <tr key={pref.category} className="border-b border-white/5">
                <td className="px-4 py-3 text-ni-muted">
                  {NOTIFICATION_CATEGORY_LABELS[pref.category]}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={pref.inAppEnabled}
                    disabled={saving === pref.category}
                    onChange={(e) =>
                      updatePref(pref.category, "inAppEnabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-cyan-500/30 text-cyan-500"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={pref.emailEnabled}
                    disabled={saving === pref.category}
                    onChange={(e) =>
                      updatePref(pref.category, "emailEnabled", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-cyan-500/30 text-cyan-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
