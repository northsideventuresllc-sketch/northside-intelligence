"use client";

import { AutopilotComingSoonCard } from "@/components/it/AutopilotComingSoonCard";

import { useState } from "react";
import Link from "next/link";
import { BridgeAIBackground } from "@/components/bridgeai/BridgeAIBackground";
import { BridgeAINav } from "@/components/bridgeai/BridgeAINav";
import { Sector3LoadingBar } from "@/components/sector3/Sector3LoadingBar";
import { Sector3TierSwitcher } from "@/components/sector3/Sector3TierSwitcher";
import { Sector3MCPDrawer } from "@/components/sector3/Sector3MCPDrawer";
import { UniversalITFeedbackWidget } from "@/components/feedback/UniversalITFeedbackWidget";

const SYSTEM_PRESETS = [
  { id: "stripe", name: "Stripe", icon: "💳", category: "Payments" },
  { id: "hubspot", name: "HubSpot", icon: "🟧", category: "CRM" },
  { id: "supabase", name: "Supabase", icon: "⚡", category: "Database" },
  { id: "resend", name: "Resend", icon: "✉️", category: "Email" },
  { id: "slack", name: "Slack", icon: "💬", category: "Comms" },
  { id: "notion", name: "Notion", icon: "📓", category: "Productivity" },
  { id: "airtable", name: "Airtable", icon: "📊", category: "Database" },
];

interface Props {
  email: string;
  planLabel: string;
  workflowsUsed: number;
  workflowsLimit: number | null;
  hasUnlimitedAccess: boolean;
  niTier: string;
  isAgenticUser?: boolean;
}

export default function BridgeAIDashboardClient({
  email,
  planLabel,
  workflowsUsed,
  workflowsLimit,
  hasUnlimitedAccess,
  niTier,
  isAgenticUser = false,
}: Props) {
  const [sourceSystem, setSourceSystem] = useState("stripe");
  const [targetSystem, setTargetSystem] = useState("supabase");
  const [goal, setGoal] = useState("Sync customer payment success events and upsert subscription status with idempotency keys.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"node" | "python" | "mcp" | "zapier">("node");
  const [copied, setCopied] = useState(false);
  const [isMCPDrawerOpen, setIsMCPDrawerOpen] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/bridgeai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceSystem,
          targetSystem,
          goal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Integration generation failed.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network connection issue while generating code.");
    } finally {
      setLoading(false);
    }
  }

  function getActiveCode() {
    if (!result) return "";
    switch (activeCodeTab) {
      case "node":
        return result.recipe?.nodeJs || result.result || "// Node.js script";
      case "python":
        return result.recipe?.python || "# Python Async integration script";
      case "mcp":
        return result.recipe?.fastMcp || "// FastMCP Tool schema for Claude/Cursor/AGY";
      case "zapier":
        return result.recipe?.zapier || result.recipe?.docs || "// Webhook recipe";
      default:
        return "";
    }
  }

  function handleCopy() {
    const code = getActiveCode();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white selection:bg-purple-500/30 selection:text-purple-200">
      <BridgeAIBackground />
      <BridgeAINav email={email} planLabel={planLabel} />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10 space-y-8">
        <AutopilotComingSoonCard />
        {/* Tier Switcher & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>BridgeAI Orchestration Studio</span>
              <span className="rounded-md border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 font-mono text-xs text-purple-300">
                Multi-Stack Ready
              </span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Instantly bridge APIs, generate production Node/Python endpoints, and author FastMCP schemas.
            </p>
          </div>

          <Sector3TierSwitcher
            toolSlug="bridgeai"
            brandColor="#8A2BE2"
            isAgenticUser={isAgenticUser}
            onOpenAgenticDrawer={() => setIsMCPDrawerOpen(true)}
          />
        </div>

        {/* Quota & Usage Bar */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-white/70">Plan: <strong className="text-white">{planLabel}</strong></span>
          </div>
          <div className="text-white/60 font-mono">
            Usage:{" "}
            <span className="text-white font-bold">
              {workflowsUsed} {workflowsLimit !== null ? `/ ${workflowsLimit} recipes` : "unlimited recipes"}
            </span>
          </div>
        </div>

        {/* Visual Synapse Node Connector Form */}
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 md:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4">
              {/* Source System */}
              <div className="md:col-span-5 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-purple-400">
                  1. Source System (Data Origin)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SYSTEM_PRESETS.map((sys) => (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => setSourceSystem(sys.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                        sourceSystem === sys.id
                          ? "border-purple-500 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(138,43,226,0.3)]"
                          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      <span>{sys.icon}</span>
                      <span>{sys.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantum Bridge Arrow Indicator */}
              <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                <div className="h-10 w-10 rounded-full border border-cyan-500/30 bg-cyan-950/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,245,212,0.25)] animate-pulse">
                  ➜
                </div>
              </div>

              {/* Destination System */}
              <div className="md:col-span-5 space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  2. Destination System (Target Action)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SYSTEM_PRESETS.map((sys) => (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => setTargetSystem(sys.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                        targetSystem === sys.id
                          ? "border-cyan-500 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,245,212,0.3)]"
                          : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      <span>{sys.icon}</span>
                      <span>{sys.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Goal Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                3. Integration Logic & Business Goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="Describe data mapping, validation rules, error retry policy, and idempotency keys…"
                className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-sans"
                required
              />
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
                Compiles typed serverless handlers + FastMCP schemas
              </span>
              <button
                type="submit"
                disabled={loading || !goal.trim()}
                className="rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(138,43,226,0.4)] transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing Synapse Code…</span>
                  </>
                ) : (
                  <>
                    <span>Generate Bridge Architecture</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 rounded-3xl border border-purple-500/30 bg-black/60 backdrop-blur-xl text-center space-y-4">
            <Sector3LoadingBar active={loading} brandColor="#8A2BE2" />
            <p className="text-xs font-mono text-purple-300 animate-pulse">
              Synthesizing Node.js, Python, and FastMCP schemas with live type-checks…
            </p>
          </div>
        )}

        {/* Output Code Tabs */}
        {result && (
          <div className="rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl space-y-4 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Bridge Solution: {sourceSystem.toUpperCase()} ➜ {targetSystem.toUpperCase()}</span>
                </h3>
                <p className="text-xs text-white/50">Multi-language production recipe with retries & webhook security.</p>
              </div>

              {/* Code Tab Switcher */}
              <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-1 border border-white/10">
                {[
                  { id: "node", label: "Node.js (TS)" },
                  { id: "python", label: "Python 3" },
                  { id: "mcp", label: "FastMCP Schema" },
                  { id: "zapier", label: "Recipe Docs" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCodeTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeCodeTab === tab.id
                        ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(138,43,226,0.4)]"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Body & Copy Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-300">
                  {activeCodeTab === "mcp" ? "Ready for Antigravity & Claude Code mcpServers:" : "Production serverless code:"}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/20 text-xs font-semibold text-purple-200 hover:bg-purple-500/30 transition"
                >
                  {copied ? "✓ Copied to Clipboard!" : "Copy Code"}
                </button>
              </div>
              <pre className="p-5 rounded-2xl border border-white/10 bg-black/95 font-mono text-xs text-cyan-200/90 overflow-x-auto whitespace-pre-wrap max-h-96">
                {getActiveCode()}
              </pre>
            </div>
          </div>
        )}
      </main>

      <Sector3MCPDrawer
        isOpen={isMCPDrawerOpen}
        onClose={() => setIsMCPDrawerOpen(false)}
        toolSlug="bridgeai"
        brandColor="#8A2BE2"
      />
    </div>
  );
}
