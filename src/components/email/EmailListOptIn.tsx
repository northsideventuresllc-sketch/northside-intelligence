"use client";

import { FormEvent, useState } from "react";

interface EmailListOptInProps {
  /** Compact inline style for forms like signup/checkout */
  compact?: boolean;
  /** Called after successful subscription */
  onSubscribed?: () => void;
  /** Pre-checked default */
  defaultChecked?: boolean;
  /** Controlled mode: show subscribe button instead of checkbox-only flow */
  standalone?: boolean;
  className?: string;
}

export function EmailListOptIn({
  compact = false,
  onSubscribed,
  defaultChecked = false,
  standalone = false,
  className = "",
}: EmailListOptInProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  async function subscribe() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/email-list/subscribe", { method: "POST" });
      const data = (await res.json()) as { error?: string; subscribed?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Could not subscribe");
        return false;
      }
      setSubscribed(true);
      onSubscribed?.();
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleStandaloneSubmit(e: FormEvent) {
    e.preventDefault();
    await subscribe();
  }

  if (standalone) {
    if (subscribed) {
      return (
        <p className={`text-sm text-emerald-400 ${className}`}>
          You are subscribed to NI updates.
        </p>
      );
    }

    return (
      <form onSubmit={handleStandaloneSubmit} className={className}>
        <p className="mb-3 text-sm text-ni-muted">
          Join the NI email list to unlock your personalized promos and product updates.
        </p>
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {loading ? "Subscribing…" : "Join Email List"}
        </button>
      </form>
    );
  }

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 ${compact ? "text-xs" : "text-sm"} ${className}`}
    >
      <input
        type="checkbox"
        checked={checked || subscribed}
        disabled={subscribed}
        onChange={(e) => setChecked(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-cyan-500/30 bg-ni-bg text-cyan-500 focus:ring-cyan-500/30"
      />
      <span className="text-ni-muted">
        Send me promos, product launches, and Smart Store deals from Northside Intelligence.
        {error && <span className="mt-1 block text-red-400">{error}</span>}
      </span>
    </label>
  );
}

/** Returns whether the opt-in checkbox is checked (for parent forms). */
export function useEmailListOptInRef() {
  return { shouldSubscribe: (checked: boolean) => checked };
}

/** Subscribe if opted in — call from parent after auth success. */
export async function subscribeIfOptedIn(optedIn: boolean): Promise<void> {
  if (!optedIn) return;
  await fetch("/api/email-list/subscribe", { method: "POST" });
}
