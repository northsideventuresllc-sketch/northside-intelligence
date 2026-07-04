"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AxonCyberTransition } from "@/components/axon/AxonCyberTransition";
import { AxonLoadingScreen } from "@/components/axon/AxonLoadingScreen";

import { axonPublicPath } from "@/lib/axon/paths";

type GatePhase = "boot" | "code" | "transition" | "denied";

export function AxonGateClient({ username }: { username: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<GatePhase>("boot");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await new Promise((resolve) => window.setTimeout(resolve, 1400));
      if (cancelled) return;

      try {
        const res = await fetch("/api/axon/access");
        const data = (await res.json()) as {
          allowed?: boolean;
          unlocked?: boolean;
          error?: string;
        };

        if (!res.ok || !data.allowed) {
          setPhase("denied");
          setError(data.error ?? "AXON is not available for this account.");
          return;
        }

        if (data.unlocked) {
          setPhase("transition");
          return;
        }

        setPhase("code");
      } catch {
        if (!cancelled) {
          setPhase("denied");
          setError("Unable to reach AXON. Try again shortly.");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/axon/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid access code.");
        return;
      }
      setPhase("transition");
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleTransitionComplete() {
    router.push(axonPublicPath(username, "/dashboard"));
    router.refresh();
  }

  if (phase === "boot") {
    return <AxonLoadingScreen label="Connecting to AXON" />;
  }

  if (phase === "denied") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (phase === "transition") {
    return <AxonCyberTransition onComplete={handleTransitionComplete} />;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="glass-panel w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
          Secure Entry
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">Enter AXON Access Code</h1>
        <p className="mt-2 text-sm text-ni-muted">
          Your code was provided when AXON access was purchased. Master accounts use the configured
          entry code.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoFocus
            placeholder="Access code"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-lg tracking-widest text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
            aria-label="AXON access code"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full rounded-xl bg-ni-cyan py-3 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Unlock AXON"}
          </button>
        </form>
      </div>
    </div>
  );
}
