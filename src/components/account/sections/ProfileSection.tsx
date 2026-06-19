"use client";

import { FormEvent, useState } from "react";
import type { AccountPageData } from "@/lib/account/get-account-page-data";

interface ProfileSectionProps {
  initialProfile: AccountPageData["initialProfile"];
}

export function ProfileSection({ initialProfile }: ProfileSectionProps) {
  const [fullName, setFullName] = useState(initialProfile.fullName ?? "");
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [email, setEmail] = useState(initialProfile.email);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email }),
      });
      const data = (await res.json()) as { error?: string; email?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to update profile");
        return;
      }
      if (data.email) setEmail(data.email);
      setMessage("Profile updated.");
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
        <h2 className="mb-4 text-lg font-semibold text-white">Profile Settings</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm text-ni-muted">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label htmlFor="username" className="mb-1 block text-sm text-ni-muted">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50"
              placeholder="letters, numbers, underscores"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-ni-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition focus:border-cyan-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </section>
    </div>
  );
}
