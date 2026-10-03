"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  label: string;
  payload?: Record<string, unknown>;
  toolSlug?: string;
  interval?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function CheckoutButton({
  label,
  payload,
  toolSlug,
  interval = "monthly",
  className,
  disabled,
  style,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalPayload = payload ?? (toolSlug ? { type: "tool_subscription", toolSlug, interval } : {});

  async function handleCheckout() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });
      const raw = await res.text();
      let data: { error?: string; url?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as { error?: string; url?: string }) : {};
      } catch {
        setError(
          res.ok
            ? "Checkout unavailable"
            : "Billing is not configured yet. Please try again shortly."
        );
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout unavailable");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        style={style}
        className={
          className ??
          "w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:opacity-50"
        }
      >
        {loading ? "Loading…" : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
