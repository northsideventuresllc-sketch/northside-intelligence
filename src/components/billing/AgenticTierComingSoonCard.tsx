"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AgenticTierComingSoonCardProps {
  toolSlug?: string;
  toolName?: string;
  variant?: "portal" | "replyflow" | "grantbot" | "signaldesk" | "gapscan" | "bridgeai";
  compact?: boolean;
  className?: string;
}

export function AgenticTierComingSoonCard({
  toolSlug = "tool",
  toolName,
  variant = "portal",
  compact = false,
  className = "",
}: AgenticTierComingSoonCardProps) {
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const displayName =
    toolName || (toolSlug.charAt(0).toUpperCase() + toolSlug.slice(1));

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const loggedIn = !!data?.user;
        setIsLoggedIn(loggedIn);
        // Returning from signup with notify intent: auto-join now that we
        // have an account (and therefore an email) on file.
        if (loggedIn && typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("notify_agentic") === toolSlug) {
            joinWithAccountEmail();
            // Clean the param so refresh doesn't re-trigger.
            params.delete("notify_agentic");
            const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
            window.history.replaceState(null, "", clean);
          }
        }
      })
      .catch(() => setIsLoggedIn(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinWithAccountEmail = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/email-list/subscribe", { method: "POST" });
    } catch {
      // non-fatal: account email is still on file for launch announcements
    } finally {
      setSubmitting(false);
      setJoinedWaitlist(true);
    }
  };

  // Logged-out users go through signup first — that guarantees an email ends
  // up on file before we ever promise a notification.
  const signupHref =
    typeof window !== "undefined"
      ? `/auth/signup?returnTo=${encodeURIComponent(`${window.location.pathname}?notify_agentic=${toolSlug}`)}`
      : "/auth/signup";

  const isReplyflow = variant === "replyflow" || toolSlug === "replyflow";
  const isGrantbot = variant === "grantbot" || toolSlug === "grantbot";
  const isSignaldesk = variant === "signaldesk" || toolSlug === "signaldesk";
  const isGapscan = variant === "gapscan" || toolSlug === "gapscan";
  const isBridgeai = variant === "bridgeai" || toolSlug === "bridgeai";

  const accentColor = isReplyflow
    ? "from-[#ff4b72] to-[#7928ca]"
    : isGrantbot
      ? "from-[#10b981] to-[#f59e0b]"
      : isSignaldesk
        ? "from-[#10b981] to-[#06b6d4]"
        : isGapscan
          ? "from-[#3b82f6] to-[#8b5cf6]"
          : isBridgeai
            ? "from-[#8b5cf6] to-[#ec4899]"
            : "from-cyan-400 to-indigo-500";

  const borderClass = isReplyflow
    ? "border-rf-rose/40 hover:border-rf-rose/70"
    : isGrantbot
      ? "border-gb-emerald/40 hover:border-gb-emerald/70"
      : "border-cyan-500/40 hover:border-cyan-400/70";

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl border bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-2xl backdrop-blur-xl transition duration-300 ${borderClass} ${className}`}
    >
      {/* Prominent Badge */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/60 bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 px-4 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          Agentic Access Coming Soon
        </span>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚡ Agentic Access</span>
          </h3>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-300">
            Autonomous
          </span>
        </div>

        <p className="mt-2 text-xs text-white/70 leading-relaxed">
          Full headless agent runtime with multi-agent orchestration for {displayName}. Operates 24/7 without manual prompting.
        </p>

        {/* Capabilities - Strictly No Prices */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300/90 mb-3">
            Core Agentic Capabilities
          </p>
          <ul className="space-y-3 text-xs text-white/80">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                ✓
              </span>
              <span>
                <strong className="text-white font-medium">Autonomous background monitoring</strong> and scheduled routine execution.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                ✓
              </span>
              <span>
                <strong className="text-white font-medium">Multi-agent synthesis</strong> without manual prompting.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                ✓
              </span>
              <span>
                <strong className="text-white font-medium">Direct webhook, CRM,</strong> and communication dispatch.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action / Future Availability */}
      <div className="mt-6 border-t border-white/10 pt-4">
        {joinedWaitlist ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 px-3 text-center text-xs font-semibold text-emerald-300">
            ✓ You're on the list — we'll email you at launch
          </div>
        ) : isLoggedIn === false ? (
          <>
            <Link
              href={signupHref}
              className={`block w-full rounded-xl bg-gradient-to-r ${accentColor} py-3 text-center text-xs font-bold text-white shadow-lg transition hover:opacity-95 hover:scale-[1.01]`}
            >
              Sign Up for Early Access Updates
            </Link>
            <p className="mt-2 text-center text-[11px] text-white/50">
              Create a free account so we have your email for the launch announcement.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={joinWithAccountEmail}
              disabled={submitting || isLoggedIn === null}
              className={`w-full rounded-xl bg-gradient-to-r ${accentColor} py-3 text-center text-xs font-bold text-white shadow-lg transition hover:opacity-95 hover:scale-[1.01] disabled:opacity-50`}
            >
              {submitting ? "Joining…" : "Get Early Access Updates"}
            </button>
            <p className="mt-2 text-center text-[11px] text-white/50">
              We&apos;ll announce it to your account email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
