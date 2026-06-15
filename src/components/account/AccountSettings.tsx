"use client";

import { FormEvent, useState } from "react";
import {
  MASTER_ACCOUNT_DESCRIPTION,
  MASTER_ACCOUNT_LABEL,
} from "@/lib/billing/master-account";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface AccountSettingsProps {
  initialProfile: {
    email: string;
    fullName: string | null;
    username: string | null;
    twoFactorEnabled: boolean;
  };
  billing: {
    niTier: string;
    billingInterval: string | null;
    hasStripeCustomer: boolean;
    toolkitCount: number;
    isMasterAccount: boolean;
  };
}

export function AccountSettings({ initialProfile, billing }: AccountSettingsProps) {
  const [fullName, setFullName] = useState(initialProfile.fullName ?? "");
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [email, setEmail] = useState(initialProfile.email);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialProfile.twoFactorEnabled);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading("profile");
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
      setLoading(null);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading("password");
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
      setLoading(null);
    }
  }

  async function saveTwoFactor(enabled: boolean) {
    setError("");
    setMessage("");
    setLoading("2fa");
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
      setMessage(enabled ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
    } catch {
      setError("Network error. Please try again.");
      setTwoFactorEnabled(!enabled);
    } finally {
      setLoading(null);
    }
  }

  async function openBillingPortal() {
    setError("");
    setLoading("billing");
    try {
      const res = await fetch("/api/account/billing/portal", { method: "POST" });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Billing portal unavailable");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {billing.isMasterAccount && (
        <section className="rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300/90">
            {MASTER_ACCOUNT_LABEL}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{MASTER_ACCOUNT_DESCRIPTION}</p>
        </section>
      )}

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
            disabled={loading === "profile"}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {loading === "profile" ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </section>

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
            disabled={loading === "password"}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {loading === "password" ? "Updating…" : "Update Password"}
          </button>
        </form>
      </section>

      <section className="glass-panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Two-Factor Authentication</h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={twoFactorEnabled}
            disabled={loading === "2fa"}
            onChange={(e) => saveTwoFactor(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ni-bg text-cyan-500 focus:ring-cyan-500/30"
          />
          <span className="text-sm text-ni-muted">
            Require an email verification code when signing in
          </span>
        </label>
      </section>

      <section className="glass-panel p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Billing</h2>
        {billing.isMasterAccount ? (
          <>
            <p className="mb-1 text-sm text-ni-muted">Current NI plan</p>
            <p className="mb-1 text-xl font-semibold text-white">Master Account</p>
            <p className="mb-4 text-sm text-ni-muted">
              {billing.toolkitCount} tool{billing.toolkitCount === 1 ? "" : "s"} in your Toolkit
            </p>
          </>
        ) : (
          <>
            <p className="mb-1 text-sm text-ni-muted">Current NI plan</p>
            <p className="mb-1 text-xl font-semibold capitalize text-white">{billing.niTier}</p>
            {billing.billingInterval && (
              <p className="mb-2 text-sm capitalize text-ni-muted">{billing.billingInterval} billing</p>
            )}
            <p className="mb-4 text-sm text-ni-muted">
              {billing.toolkitCount} tool{billing.toolkitCount === 1 ? "" : "s"} in your Toolkit
            </p>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          {!billing.isMasterAccount && (
            <a
              href="/#pricing"
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
            >
              View NI Plans
            </a>
          )}
          <a
            href="/toolkit"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Open Toolkit
          </a>
          {billing.hasStripeCustomer && (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={loading === "billing"}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
            >
              {loading === "billing" ? "Loading…" : "Manage Billing"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
