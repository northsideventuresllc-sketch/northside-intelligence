"use client";

import { useState } from "react";

export function AxonWaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/axon/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Signup failed. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "You are on the AXON waitlist.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Signup failed. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-axon-gold/30 bg-axon-surface px-6 py-5 text-center">
        <p className="text-sm font-medium text-axon-gold">{message}</p>
        <p className="mt-1 text-xs text-axon-muted">
          We&apos;ll reach out when your spot opens. No spam — ever.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="axon-waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="axon-waitlist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="flex-1 rounded-lg border border-axon-border bg-axon-elevated px-4 py-3 text-sm text-axon-text placeholder:text-axon-muted/60 outline-none transition focus:border-axon-gold/50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-axon-gold px-6 py-3 text-sm font-semibold text-black transition hover:bg-axon-gold/90 disabled:opacity-50"
        >
          {status === "loading" ? "Joining…" : "Join the waitlist"}
        </button>
      </div>
      {status === "error" && message && (
        <p className="text-sm text-axon-danger">{message}</p>
      )}
      <p className="text-xs text-axon-muted">
        Waitlist only — we&apos;ll never sell or share your email.
      </p>
    </form>
  );
}
