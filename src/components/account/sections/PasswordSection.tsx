"use client";

import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to update password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch {
      setError("Network error. Please try again.");
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
        <h2 className="mb-4 text-lg font-semibold text-white">Password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-sm text-ni-muted">
              Current Password
            </label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              inputClassName="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 pr-12 text-white outline-none transition focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm text-ni-muted">
              New Password
            </label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              inputClassName="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 pr-12 text-white outline-none transition focus:border-cyan-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
