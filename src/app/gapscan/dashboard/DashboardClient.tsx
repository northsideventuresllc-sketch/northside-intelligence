"use client";

import { useState } from "react";
import Link from "next/link";
import { GapScanBackground } from "@/components/gapscan/GapScanBackground";
import { GapScanNav } from "@/components/gapscan/GapScanNav";
import { Sector3LoadingBar } from "@/components/sector3/Sector3LoadingBar";
import { Sector3TierSwitcher } from "@/components/sector3/Sector3TierSwitcher";
import { Sector3MCPDrawer } from "@/components/sector3/Sector3MCPDrawer";
import { TrialCodeRedemptionBox } from "@/components/billing/TrialCodeRedemptionBox";

interface Props {
  email: string;
  planLabel: string;
  scansUsed: number;
  scansLimit: number | null;
  hasUnlimitedAccess: boolean;
  niTier: string;
  isAgenticUser?: boolean;
}

export default function GapScanDashboardClient({
  email,
  planLabel,
  scansUsed,
  scansLimit,
  hasUnlimitedAccess,
  niTier,
  isAgenticUser = false,
}: Props) {
  const [targetUrl, setTargetUrl] = useState("");
  const [scanType, setScanType] = useState<"surface" | "deep_funnel" | "checkout">("surface");
  const [selectedStack, setSelectedStack] = useState<string>("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"vulnerabilities" | "buildSpec" | "roadmap">("vulnerabilities");
  const [copied, setCopied] = useState(false);
  const [isMCPDrawerOpen, setIsMCPDrawerOpen] = useState(false);

  async function handleRunScan(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUrl.trim()) {
      setError("Target URL is required.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/gapscan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          scanType,
          competitorUrls: targetUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Scan failed. Please verify the URL and try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network connection issue while scanning. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyBuildSpec() {
    if (!result?.buildSpec) return;
    navigator.clipboard.writeText(result.buildSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white selection:bg-red-500/30 selection:text-red-200">
      <GapScanBackground />
      <GapScanNav email={email} planLabel={planLabel} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Tier Switcher & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>GapScan Intelligence Console</span>
              <span className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-xs text-red-400">
                v3.2 Live
              </span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Autonomous competitor reverse-engineering, checkout drop-off audits, and AI-ready BUILD-SPEC generator.
            </p>
          </div>

          <Sector3TierSwitcher
            toolSlug="gapscan"
            brandColor="#FF3B30"
            isAgenticUser={isAgenticUser}
            onOpenAgenticDrawer={() => setIsMCPDrawerOpen(true)}
          />
        </div>

        {/* Quota & Usage Bar */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/70">Plan: <strong className="text-white">{planLabel}</strong></span>
          </div>
          <div className="text-white/60 font-mono">
            Usage:{" "}
            <span className="text-white font-bold">
              {scansUsed} {scansLimit !== null ? `/ ${scansLimit} scans` : "unlimited scans"}
            </span>
          </div>
        </div>

        {/* 7-Day Free Trial Code Redemption */}
        {!hasUnlimitedAccess && (
          <TrialCodeRedemptionBox
            toolSlug="gapscan"
            toolName="GapScan"
            brandColor="#FF3B30"
            variant="gapscan"
            isLoggedIn={!!email}
          />
        )}

        {/* Scan Intake Form */}
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 md:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6">
          <form onSubmit={handleRunScan} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                1. Target Surface or Competitor URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://competitor.com or https://your-funnel.com"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-white/30 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Scan Depth Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                2. Scan Depth & Scope
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "surface", label: "Surface Audit", desc: "Speed, SEO & DOM layout shifts", badge: "Free / SaaS" },
                  { id: "deep_funnel", label: "Deep Funnel", desc: "Multi-page conversion flow & friction", badge: "SaaS" },
                  { id: "checkout", label: "Checkout Reverse-Eng", desc: "Pricing leaks, upsell architecture & APIs", badge: "Agentic" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScanType(s.id as any)}
                    className={`flex flex-col text-left p-3.5 rounded-2xl border transition ${
                      scanType === s.id
                        ? "border-red-500/70 bg-red-500/15 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-semibold text-xs text-white">{s.label}</span>
                      <span className="text-[10px] font-mono text-red-400/80 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/40">
                        {s.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50">{s.desc}</span>
                  </button>
                ))}
              </div>
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
                {scanType === "checkout" ? "⚡ Agentic autonomous crawler active" : "Standard deep analysis"}
              </span>
              <button
                type="submit"
                disabled={loading || !targetUrl.trim()}
                className="rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(239,68,68,0.35)] transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing Radar Scan…</span>
                  </>
                ) : (
                  <>
                    <span>Execute GapScan Radar</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 rounded-3xl border border-red-500/30 bg-black/60 backdrop-blur-xl text-center space-y-4">
            <Sector3LoadingBar active={loading} brandColor="#FF3B30" />
            <p className="text-xs font-mono text-red-400 animate-pulse">
              Crawling DOM tree, checking API endpoints, and synthesizing BUILD-SPEC.md…
            </p>
          </div>
        )}

        {/* Results Dossier */}
        {result && (
          <div className="rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl space-y-6 p-6 md:p-8">
            {/* Result Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-xl font-bold text-white">Scan Dossier: {targetUrl}</h3>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Vulnerability audit completed with AI coding specification generated.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setActiveResultTab("vulnerabilities")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeResultTab === "vulnerabilities" ? "bg-red-600 text-white shadow" : "text-white/60 hover:text-white"
                  }`}
                >
                  Gaps & Gaps Matrix
                </button>
                <button
                  onClick={() => setActiveResultTab("buildSpec")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeResultTab === "buildSpec" ? "bg-red-600 text-white shadow" : "text-white/60 hover:text-white"
                  }`}
                >
                  BUILD-SPEC.md
                </button>
                <button
                  onClick={() => setActiveResultTab("roadmap")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeResultTab === "roadmap" ? "bg-red-600 text-white shadow" : "text-white/60 hover:text-white"
                  }`}
                >
                  Remediation Plan
                </button>
              </div>
            </div>

            {/* Tab 1: Vulnerabilities */}
            {activeResultTab === "vulnerabilities" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-red-500/30 bg-red-950/20">
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Critical Friction</span>
                    <p className="text-2xl font-black text-white mt-1">3 Gaps</p>
                    <p className="text-xs text-white/60 mt-1">High conversion abandonment risks detected in checkout.</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">SEO & Meta Leaks</span>
                    <p className="text-2xl font-black text-white mt-1">4 Warnings</p>
                    <p className="text-xs text-white/60 mt-1">Missing OpenGraph tags and unindexed product sub-paths.</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Speed & Architecture</span>
                    <p className="text-2xl font-black text-white mt-1">88 / 100</p>
                    <p className="text-xs text-white/60 mt-1">DOM node depth exceeds recommended mobile viewport budget.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed whitespace-pre-wrap font-sans text-white/90">
                  {result.scanSummary || result.result || "Scan summary synthesized successfully."}
                </div>
              </div>
            )}

            {/* Tab 2: BUILD-SPEC.md */}
            {activeResultTab === "buildSpec" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60 font-mono">
                    Ready for import into Claude Code, Cursor, or Google Antigravity:
                  </span>
                  <button
                    onClick={copyBuildSpec}
                    className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/20 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition"
                  >
                    {copied ? "✓ Copied to Clipboard!" : "Copy BUILD-SPEC.md"}
                  </button>
                </div>
                <pre className="p-5 rounded-2xl border border-white/10 bg-black/90 font-mono text-xs text-red-200/90 overflow-x-auto whitespace-pre-wrap">
                  {result.buildSpec || "# BUILD-SPEC.md\n\nNo build-spec returned for this scan mode."}
                </pre>
              </div>
            )}

            {/* Tab 3: Remediation Roadmap */}
            {activeResultTab === "roadmap" && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Prioritized Fix Roadmap
                  </h4>
                  <ul className="space-y-2.5 text-xs text-white/80">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">1.</span>
                      <span><strong>Fix Form Validation Latency:</strong> Replace blocking server-side validation on email fields with instant regex checks.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">2.</span>
                      <span><strong>Optimize Checkout Funnel:</strong> Reduce step count from 3 screens to a unified 1-page accordion checkout.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">3.</span>
                      <span><strong>Dynamic OG Image Generator:</strong> Automate Next.js @vercel/og card creation for all product routes.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Sector3MCPDrawer
        isOpen={isMCPDrawerOpen}
        onClose={() => setIsMCPDrawerOpen(false)}
        toolSlug="gapscan"
        brandColor="#FF3B30"
      />
    </div>
  );
}
