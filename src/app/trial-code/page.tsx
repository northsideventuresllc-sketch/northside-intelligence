"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOOL_LABELS: Record<string, string> = {
  all: "any Intelligence Tool",
  replyflow: "ReplyFlow",
  grantbot: "GrantBot",
  signaldesk: "SignalDesk",
  gapscan: "GapScan",
  bridgeai: "BridgeAI",
};

const TOOL_PATHS: Record<string, string> = {
  replyflow: "/replyflow",
  grantbot: "/grantbot",
  signaldesk: "/signaldesk",
  gapscan: "/gapscan",
  bridgeai: "/bridgeai",
};

export default function TrialCodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [genError, setGenError] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/billing/trial-code/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.status === 401) {
          router.replace("/auth/signup?returnTo=/trial-code");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setGenError(data.error || "Could not prepare your trial code.");
        } else {
          setExpiresAt(data.expiresAt || "");
        }
      } catch {
        setGenError("Could not prepare your trial code. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setValidating(true);
    try {
      const res = await fetch("/api/billing/trial-code/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || "Invalid trial code.");
        return;
      }
      const slug = (data.toolSlug || "all").toLowerCase();
      const path = TOOL_PATHS[slug] ?? "/toolkit";
      router.push(`${path}?trialCode=${encodeURIComponent(data.code)}`);
    } catch {
      setError("Could not validate the code. Please try again.");
    } finally {
      setValidating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ni-bg">
        <p className="text-white/60">Preparing your trial…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ni-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8">
        <h1 className="text-2xl font-bold text-white">Your free trial code</h1>
        {genError ? (
          <p className="mt-4 text-sm text-red-300">{genError}</p>
        ) : (
          <p className="mt-2 text-sm text-white/70">
            We sent your personal trial code to your email. Enter it below
            within 48 hours
            {expiresAt
              ? ` (by ${new Date(expiresAt).toLocaleString()})`
              : ""}
            {" "}to start your 7-day free trial.
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="NI-XXXX-XXXX"
            maxLength={12}
            className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 text-center text-lg tracking-[0.2em] text-white placeholder:text-white/30"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={validating || !code.trim()}
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-black disabled:opacity-40"
          >
            {validating ? "Checking…" : "Start my trial"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-white/50">
          Each account gets one trial code. Codes expire 48 hours after issue.
        </p>
      </div>
    </div>
  );
}
