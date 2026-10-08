"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface TrialCodeRedemptionBoxProps {
  toolSlug: string;
  toolName?: string;
  brandColor?: string;
  variant?: "portal" | "replyflow" | "grantbot" | "signaldesk" | "gapscan" | "bridgeai";
  isLoggedIn?: boolean;
  onSuccess?: (result: { code: string; expiresAt: string; durationDays: number }) => void;
  className?: string;
}

export function TrialCodeRedemptionBox({
  toolSlug,
  toolName,
  brandColor = "#06b6d4",
  variant = "portal",
  isLoggedIn = true,
  onSuccess,
  className = "",
}: TrialCodeRedemptionBoxProps) {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [trialDetails, setTrialDetails] = useState<{
    expiresAt?: string;
    durationDays?: number;
  } | null>(null);

  const displayName = toolName || (toolSlug.charAt(0).toUpperCase() + toolSlug.slice(1));

  // Check URL parameters on mount
  useEffect(() => {
    const urlCode =
      searchParams?.get("code") ||
      searchParams?.get("trial_code") ||
      searchParams?.get("trial");
    if (urlCode) {
      setCode(urlCode.toUpperCase().trim());
    }
  }, [searchParams]);

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter an alphanumeric access code.");
      return;
    }

    if (!isLoggedIn) {
      window.location.href = `/auth/signup?returnTo=/${toolSlug}/dashboard&code=${encodeURIComponent(
        cleanCode
      )}&tool=${toolSlug}`;
      return;
    }

    setError("");
    setLoading(true);
    setSuccess(null);

    try {
      const res = await fetch("/api/billing/trial-code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode, toolSlug }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to redeem code. Please check and try again.");
        return;
      }

      const expiryDate = data.expiresAt
        ? new Date(data.expiresAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "7 days";

      setSuccess(`✓ 7-Day Unlocked Free Trial Activated! Valid through ${expiryDate}.`);
      setTrialDetails({
        expiresAt: data.expiresAt,
        durationDays: data.durationDays,
      });

      if (onSuccess) {
        onSuccess(data);
      }

      // Reload page after brief delay to refresh entitlements across the dashboard
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setError("Network error while activating trial code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-xl transition ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
            <span>🎁</span>
            <span>7-Day Free Trial Code Access</span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-white">
            Have an outreach access code for {displayName}?
          </h3>
          <p className="mt-1 text-xs text-white/60">
            Redeem your unique alphanumeric code for 7 full days of unlocked tool access.
            Reverts to the Free tier (10 runs/month baseline) when complete with zero loss of saved history.
          </p>
        </div>
      </div>

      <form onSubmit={handleRedeem} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="e.g. NORTHSIDE-7DAY"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 font-mono text-sm tracking-wider uppercase text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="rounded-xl px-5 py-2.5 text-xs font-semibold text-[#07080C] shadow-md transition hover:scale-[1.02] disabled:opacity-40"
          style={{ backgroundColor: brandColor }}
        >
          {loading ? "Activating…" : "Redeem 7-Day Access"}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {success}
        </div>
      )}
    </div>
  );
}
