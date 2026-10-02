"use client";

import { useState } from "react";
import Link from "next/link";
import { getSector3AgenticPricing } from "@/lib/billing/sector3-tool-pricing";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

interface AddToToolCasePromptProps {
  toolSlug: string;
  toolName: string;
  variant?: "portal" | "replyflow" | "grantbot";
}

export function AddToToolCasePrompt({
  toolSlug,
  toolName,
  variant = "portal",
}: AddToToolCasePromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isReplyflow = variant === "replyflow";
  const isGrantbot = variant === "grantbot";

  const pricing = getSector3AgenticPricing(toolSlug);

  async function handleAddFree() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/toolkit/add-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add tool");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const containerClass = isReplyflow
    ? "rf-glass rounded-3xl p-8 max-w-4xl mx-auto"
    : isGrantbot
      ? "gb-glass rounded-3xl p-8 max-w-4xl mx-auto"
      : "glass-panel p-8 max-w-4xl mx-auto";

  return (
    <div className={containerClass}>
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Unlock {toolName}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-white/60">
          Choose how you want to deploy {toolName}: start on the Free tier, get unlimited SaaS access, or deploy autonomous headless agents.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Free Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Free Community</h3>
            <div className="mt-2 text-xl font-extrabold text-white">
              $0 <span className="text-xs font-normal text-white/50">/month</span>
            </div>
            <p className="mt-2 text-xs text-white/60">
              Basic quotas included for personal or exploratory use.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/70">
              <li>✓ Included monthly quota</li>
              <li>✓ Web dashboard interface</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleAddFree}
              disabled={loading}
              className="w-full rounded-xl border border-white/20 bg-white/10 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50 transition"
            >
              {loading ? "Adding..." : "Add Free to Toolkit"}
            </button>
          </div>
        </div>

        {/* SaaS Card */}
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
              Unlimited Access
            </div>
            <h3 className="text-base font-bold text-white">SaaS Tier</h3>
            <div className="mt-2 text-xl font-extrabold text-white">
              ${pricing.saasMonthlyPrice}{" "}
              <span className="text-xs font-normal text-white/50">/month</span>
            </div>
            <p className="mt-2 text-xs text-white/60">
              Unlimited runs, high-priority compute, and BYOK capabilities.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/70">
              <li>✓ Unlimited runs & exports</li>
              <li>✓ Priority queue</li>
              <li>✓ Resend email dossiers</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-cyan-500/20">
            <CheckoutButton
              toolSlug={toolSlug}
              interval="monthly"
              label={`Get SaaS ($${pricing.saasMonthlyPrice}/mo)`}
              className="w-full"
            />
          </div>
        </div>

        {/* Agentic Card */}
        <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
              ⚡ Autonomous Headless
            </div>
            <h3 className="text-base font-bold text-white">Agentic Tier</h3>
            <div className="mt-2 text-xl font-extrabold text-white">
              ${pricing.agenticMonthlyPrice}{" "}
              <span className="text-xs font-normal text-white/50">/month</span>
            </div>
            <p className="mt-2 text-xs text-white/60">
              Automated headless cron loops, dedicated Agent keys, and FastMCP tools.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-white/70">
              <li>✓ Dedicated Agent API Keys</li>
              <li>✓ Pre-configured FastMCP tools</li>
              <li>✓ Automated cron sweeps</li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-purple-500/20">
            <CheckoutButton
              toolSlug={toolSlug}
              interval="monthly"
              label={`Get Agentic ($${pricing.agenticMonthlyPrice}/mo)`}
              className="w-full !bg-purple-600 hover:!bg-purple-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-center text-xs text-red-300" role="alert">
          {error}
        </p>
      )}

      <p className="mt-6 text-center text-xs text-white/50">
        Or view all available tools and manage slots in your{" "}
        <Link href="/toolkit" className="text-cyan-400 hover:underline">
          Toolkit Dashboard
        </Link>
      </p>
    </div>
  );
}
