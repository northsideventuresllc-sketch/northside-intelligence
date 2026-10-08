"use client";

import { useState } from "react";
import Link from "next/link";
import { SignalDeskBackground } from "@/components/signaldesk/SignalDeskBackground";
import { SignalDeskNav } from "@/components/signaldesk/SignalDeskNav";
import { Sector3LoadingBar } from "@/components/sector3/Sector3LoadingBar";
import { Sector3TierSwitcher } from "@/components/sector3/Sector3TierSwitcher";
import { Sector3MCPDrawer } from "@/components/sector3/Sector3MCPDrawer";
import { UniversalITFeedbackWidget } from "@/components/feedback/UniversalITFeedbackWidget";
import { TrialCodeRedemptionBox } from "@/components/billing/TrialCodeRedemptionBox";

const FOCUS_AREAS = [
  { id: "Competitor", label: "Competitor Moves", icon: "🎯", desc: "Pricing shifts, new features, and stealth launches" },
  { id: "Market", label: "Market Momentum", icon: "📈", desc: "Demand surges, funding announcements, and TAM shifts" },
  { id: "Product", label: "Product Launches", icon: "🚀", desc: "Show HN, ProductHunt trends, and release cadence" },
  { id: "Regulatory", label: "Regulatory & Legal", icon: "⚖️", desc: "FTC, compliance, privacy, and industry mandates" },
];

interface Props {
  email: string;
  planLabel: string;
  signalsUsed: number;
  signalsLimit: number | null;
  hasUnlimitedAccess: boolean;
  niTier: string;
  isAgenticUser?: boolean;
}

export default function SignalDeskDashboardClient({
  email,
  planLabel,
  signalsUsed,
  signalsLimit,
  hasUnlimitedAccess,
  niTier,
  isAgenticUser = false,
}: Props) {
  const [focusArea, setFocusArea] = useState("Competitor");
  const [targetQuery, setTargetQuery] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "tactical" | "email">("summary");
  const [copied, setCopied] = useState(false);
  const [isMCPDrawerOpen, setIsMCPDrawerOpen] = useState(false);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!targetQuery.trim()) {
      setError("Please specify market keywords or competitor domains.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/signaldesk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusArea,
          rawSignals: targetQuery.trim(),
          sendEmailBriefing: sendEmail,
          recipientEmail: sendEmail ? recipientEmail : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signal scan failed.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network connection issue while scanning signals.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result?.briefing?.markdownContent && !result?.result) return;
    navigator.clipboard.writeText(result.briefing?.markdownContent || result.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const threatLevel = result?.briefing?.threatLevel || "ELEVATED";
  const threatColors =
    threatLevel === "CRITICAL"
      ? "border-red-500/50 bg-red-950/30 text-red-400"
      : threatLevel === "ELEVATED"
        ? "border-amber-500/50 bg-amber-950/30 text-amber-400"
        : "border-emerald-500/50 bg-emerald-950/30 text-emerald-400";

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white selection:bg-emerald-500/30 selection:text-emerald-200">
      <SignalDeskBackground />
      <SignalDeskNav email={email} planLabel={planLabel} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Tier Switcher & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Signal Desk Telemetry Feed</span>
              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs text-emerald-300">
                Multi-Source Radar
              </span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Live competitor telemetry, C-suite threat-level briefs, and autonomous weekly email alerts.
            </p>
          </div>

          <Sector3TierSwitcher
            toolSlug="signaldesk"
            brandColor="#10B981"
            isAgenticUser={isAgenticUser}
            onOpenAgenticDrawer={() => setIsMCPDrawerOpen(true)}
          />
        </div>

        {/* Quota & Usage Bar */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/70">Plan: <strong className="text-white">{planLabel}</strong></span>
          </div>
          <div className="text-white/60 font-mono">
            Usage:{" "}
            <span className="text-white font-bold">
              {signalsUsed} {signalsLimit !== null ? `/ ${signalsLimit} signals` : "unlimited signals"}
            </span>
          </div>
        </div>

        {/* 7-Day Free Trial Code Redemption */}
        {!hasUnlimitedAccess && (
          <TrialCodeRedemptionBox
            toolSlug="signaldesk"
            toolName="Signal Desk"
            brandColor="#10B981"
            variant="signaldesk"
            isLoggedIn={!!email}
          />
        )}

        {/* Signal Scanner Input Form */}
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 md:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6">
          <form onSubmit={handleScan} className="space-y-6">
            {/* Focus Area Grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                1. Intelligence Focus Area
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {FOCUS_AREAS.map((fa) => (
                  <button
                    key={fa.id}
                    type="button"
                    onClick={() => setFocusArea(fa.id)}
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition ${
                      focusArea === fa.id
                        ? "border-emerald-500 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.25)] text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{fa.icon}</span>
                      <span className="font-semibold text-xs text-white">{fa.label}</span>
                    </div>
                    <span className="text-[11px] text-white/50">{fa.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Keywords / URLs */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                2. Target Keywords, Competitor Domains, or Raw Headlines
              </label>
              <textarea
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                rows={3}
                placeholder="e.g. competitor.com, AI prompt engineering startups, enterprise customer support pricing shifts…"
                className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                required
              />
            </div>

            {/* Email Dispatch Checkbox */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-white/5">
              <label className="flex items-center gap-3 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="rounded border-white/20 bg-black text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-white/80">Dispatch formatted briefing to email via Resend</span>
              </label>
              {sendEmail && (
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@company.com"
                  className="rounded-xl border border-white/20 bg-black px-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-emerald-500 font-mono"
                  required={sendEmail}
                />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-white/40 font-mono">
                Multi-source scanner: Web news + HN/ProductHunt + GitHub velocity
              </span>
              <button
                type="submit"
                disabled={loading || !targetQuery.trim()}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Intercepting Signals…</span>
                  </>
                ) : (
                  <>
                    <span>Compile Signal Brief</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 rounded-3xl border border-emerald-500/30 bg-black/60 backdrop-blur-xl text-center space-y-4">
            <Sector3LoadingBar active={loading} brandColor="#10B981" />
            <p className="text-xs font-mono text-emerald-300 animate-pulse">
              Aggregating media feeds, calculating threat levels, and drafting executive countermeasures…
            </p>
          </div>
        )}

        {/* Results Dossier */}
        {result && (
          <div className="rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl space-y-6 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider ${threatColors}`}>
                    {threatLevel} THREAT LEVEL
                  </span>
                  <h3 className="text-xl font-bold text-white">{result.briefing?.title || "Executive Intelligence Briefing"}</h3>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Synthesized across live web sources and developer release metrics.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === "summary" ? "bg-emerald-600 text-white shadow" : "text-white/60 hover:text-white"
                  }`}
                >
                  Executive Dossier
                </button>
                <button
                  onClick={() => setActiveTab("tactical")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === "tactical" ? "bg-emerald-600 text-white shadow" : "text-white/60 hover:text-white"
                  }`}
                >
                  Tactical Actions
                </button>
                <button
                  onClick={() => setActiveTab("email")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === "email" ? "bg-emerald-600 text-white shadow" : "text-white/60 hover:text-white"
                  }`}
                >
                  Email Status
                </button>
              </div>
            </div>

            {/* Tab 1: Executive Dossier */}
            {activeTab === "summary" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50 font-mono">Executive Summary & Threat Analysis:</span>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                  >
                    {copied ? "✓ Copied to Clipboard!" : "Copy Full Brief"}
                  </button>
                </div>
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-sm leading-relaxed whitespace-pre-wrap font-sans text-white/90">
                  {result.briefing?.markdownContent || result.result || "Briefing text generated."}
                </div>
              </div>
            )}

            {/* Tab 2: Tactical Actions */}
            {activeTab === "tactical" && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-emerald-400 font-mono uppercase tracking-wider">
                    Recommended Immediate Countermeasures
                  </h4>
                  <ul className="space-y-3 text-xs text-white/80">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">1.</span>
                      <span><strong>Price Positioning:</strong> Lock competitive advantage by advertising our transparent SaaS BYOK model against locked vendor pricing.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-amber-400 font-bold">2.</span>
                      <span><strong>Feature Moat:</strong> Accelerate Agentic headless MCP integration to outpace static prompt chatbots.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">3.</span>
                      <span><strong>Marketing Outreach:</strong> Deploy targeted LinkedIn outreach emphasizing verified domain benchmarks and zero hallucination.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 3: Email Status */}
            {activeTab === "email" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-3 text-xs">
                <span className="font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Transactional Dispatch
                </span>
                <p className="text-white/80">
                  {result.emailDispatched
                    ? `✓ Successfully delivered to ${result.emailRecipient || recipientEmail} via Resend.`
                    : "Email delivery was not triggered for this run. Enable the email checkbox on the form to receive briefings automatically."}
                </p>
                <div className="p-4 rounded-xl border border-white/10 bg-black/60 font-mono text-[11px] text-white/60">
                  Resend Service: READY · HTML Template: Executive Dark · Delivery Latency: ~1.2s
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Sector3MCPDrawer
        isOpen={isMCPDrawerOpen}
        onClose={() => setIsMCPDrawerOpen(false)}
        toolSlug="signaldesk"
        brandColor="#10B981"
      />

      <UniversalITFeedbackWidget toolSlug="signaldesk" toolName="Signal Desk" />
    </div>
  );
}
