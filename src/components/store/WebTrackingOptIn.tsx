"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function WebTrackingOptIn() {
  const [enabled, setEnabled] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/store/preferences")
      .then(async (res) => {
        if (res.status === 401) {
          if (!cancelled) setSignedIn(false);
          return;
        }
        if (!cancelled) setSignedIn(true);
        const data = (await res.json()) as { webTrackingEnabled?: boolean };
        if (!cancelled) setEnabled(Boolean(data.webTrackingEnabled));
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    if (!signedIn) return;
    setSaving(true);
    setMessage("");
    const next = !enabled;
    try {
      const res = await fetch("/api/store/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webTrackingEnabled: next }),
      });
      const data = (await res.json()) as { webTrackingEnabled?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setEnabled(Boolean(data.webTrackingEnabled));
      setMessage(next ? "Personalization enhanced with web interest signals." : "Web tracking off.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save preference");
    } finally {
      setSaving(false);
    }
  }

  if (signedIn === false) {
    return (
      <p className="mb-8 text-center text-xs text-ni-muted">
        <Link href="/auth/signin" className="text-cyan-300 hover:underline">
          Sign In
        </Link>{" "}
        to unlock personalized viral picks and optional web interest tracking.
      </p>
    );
  }

  if (signedIn === null) return null;

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Smart Personalization</p>
          <p className="mt-1 text-xs text-ni-muted">
            We learn from your store searches, clicks, and purchases. Optionally allow web interest
            tracking to refine your daily top 10.
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={saving}
          className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
            enabled
              ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
              : "border-white/15 bg-white/5 text-ni-muted hover:border-cyan-400/30 hover:text-cyan-200"
          }`}
        >
          {saving ? "Saving…" : enabled ? "Web Tracking On" : "Enable Web Tracking"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-cyan-300/90">{message}</p>}
    </div>
  );
}
