"use client";

import { useState } from "react";
import type { AccountPageData } from "@/lib/account/get-account-page-data";

interface SecuritySectionProps {
  initialProfile: AccountPageData["initialProfile"];
}

export function SecuritySection({ initialProfile }: SecuritySectionProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialProfile.twoFactorEnabled);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveTwoFactor(enabled: boolean) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/two-factor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to update two-factor setting");
        setTwoFactorEnabled(!enabled);
        return;
      }
      setTwoFactorEnabled(enabled);
      setMessage(
        enabled ? "Two-factor authentication enabled." : "Two-factor authentication disabled."
      );
    } catch {
      setError("Network error. Please try again.");
      setTwoFactorEnabled(!enabled);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      <section className="glass-panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Two-Factor Authentication</h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={twoFactorEnabled}
            disabled={loading}
            onChange={(e) => saveTwoFactor(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ni-bg text-cyan-500 focus:ring-cyan-500/30"
          />
          <span className="text-sm text-ni-muted">
            Require an email verification code when signing in
          </span>
        </label>
      </section>
    </div>
  );
}
