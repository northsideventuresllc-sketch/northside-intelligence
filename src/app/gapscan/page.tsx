import Link from "next/link";
import Image from "next/image";
import { GapScanBackground } from "@/components/gapscan/GapScanBackground";
import { GapScanNav } from "@/components/gapscan/GapScanNav";
import { UniversalITFeedbackWidget } from "@/components/feedback/UniversalITFeedbackWidget";

export default function GapScanLandingPage() {
  return (
    <div className="relative min-h-screen bg-[#07090e] text-white selection:bg-red-500/30 selection:text-red-200">
      <GapScanBackground />
      <GapScanNav />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-mono text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>AUTONOMOUS VULNERABILITY REVERSE-ENGINEERING</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Audit Any Product Funnel. <br />
          <span className="bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 bg-clip-text text-transparent">
            Reverse-Engineer Gaps Into Code.
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed font-sans">
          GapScan autonomously crawls target web apps, extracts checkout friction points, SEO drift, and DOM bottlenecks, then compiles actionable, production-ready <code className="text-red-300 bg-red-950/60 px-1.5 py-0.5 rounded font-mono text-xs">BUILD-SPEC.md</code> files ready for Claude Code, Cursor, and Antigravity.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/gapscan/dashboard"
            className="rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 px-8 py-4 text-sm font-bold text-white shadow-[0_0_35px_rgba(239,68,68,0.4)] transition hover:opacity-90"
          >
            Launch GapScan Console →
          </Link>
          <a
            href="#pricing"
            className="rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Explore 3-Tier Architecture
          </a>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-red-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-white">Full-Funnel Crawl Radar</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Detects layout shifts, high-friction checkout forms, unoptimized API payloads, and unindexed product sub-paths across single-page apps.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-orange-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-orange-500/30 bg-orange-500/10 flex items-center justify-center text-2xl">
              📄
            </div>
            <h3 className="text-xl font-bold text-white">AI-Ready BUILD-SPEC.md</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Turns competitor weaknesses and performance flaws directly into copy-paste prompt dossiers for your AI coding agents with zero hallucination.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-amber-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-white">Autonomous Agentic MCP</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Deploy headless workers that monitor target URLs continuously, dispatching alert webhooks and PR suggestions when competitor code shifts.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Tier Model & Pricing Section */}
      <section id="pricing" className="relative z-10 mx-auto max-w-5xl px-6 py-20 border-t border-white/10">
        <div className="text-center space-y-3 mb-12">
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-mono text-red-400 uppercase tracking-wider">
            Clear 3-Tier Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Predictable, Value-Driven Tiers</h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Choose self-serve browser scans or deploy autonomous headless agents with custom MCP servers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="rounded-3xl border border-white/10 bg-black/50 p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-white/50 tracking-wider">Community Scan</span>
              <h3 className="text-2xl font-bold text-white mt-1">Free Tier</h3>
              <p className="text-xs text-white/60 mt-2">Surface-level audits for early startups.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-white/50"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-white/70">
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> 10 Surface Scans / month</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> DOM Performance & SEO Check</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✓</span> Standard Vulnerability Matrix</li>
              </ul>
            </div>
            <Link
              href="/gapscan/dashboard"
              className="mt-8 block text-center py-3 rounded-xl border border-white/20 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Start Free Scan
            </Link>
          </div>

          {/* SaaS Tier */}
          <div className="rounded-3xl border border-white/20 bg-black/70 p-8 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-xs font-mono uppercase text-red-400 tracking-wider">SaaS Standard</span>
              <h3 className="text-2xl font-bold text-white mt-1">SaaS Unlimited</h3>
              <p className="text-xs text-white/60 mt-2">Deep funnel & checkout reverse-engineering.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$18</span>
                <span className="text-xs text-white/50"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-white/80">
                <li className="flex items-center gap-2"><span className="text-red-400 font-bold">✓</span> Unlimited Deep Funnel Scans</li>
                <li className="flex items-center gap-2"><span className="text-red-400 font-bold">✓</span> Full Checkout Flow Decompilation</li>
                <li className="flex items-center gap-2"><span className="text-red-400 font-bold">✓</span> BUILD-SPEC.md File Generator</li>
                <li className="flex items-center gap-2"><span className="text-red-400 font-bold">✓</span> Saved Scan History & Diff Engine</li>
              </ul>
            </div>
            <Link
              href="/auth/signup?returnTo=/gapscan/dashboard"
              className="mt-8 block text-center py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-xs font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:opacity-95 transition"
            >
              Subscribe SaaS ($18/mo)
            </Link>
          </div>

          {/* Agentic Tier (Featured) */}
          <div className="relative rounded-3xl border-2 border-red-500/70 bg-red-950/20 p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(239,68,68,0.25)]">
            <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-red-600 to-amber-500 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
              Highest Leverage
            </span>
            <div>
              <span className="text-xs font-mono uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Agentic Headless</span>
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Autonomous Agent</h3>
              <p className="text-xs text-white/60 mt-2">Headless background workers & dedicated MCPs.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$45</span>
                <span className="text-xs text-white/50"> / month</span>
                <p className="text-[10px] text-red-400/80 mt-1">Includes 2.5x compute & dedicated API key</p>
              </div>
              <ul className="space-y-3 text-xs text-white/90">
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Everything in SaaS Standard</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Dedicated Agent API Key (ni_agt_...)</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> FastMCP Schema for Claude/Cursor/AGY</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Automated Weekly Regression Scans</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Webhook Alerts for Competitor Drift</li>
              </ul>
            </div>
            <Link
              href="/auth/signup?returnTo=/gapscan/settings"
              className="mt-8 block text-center py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-xs font-black text-white shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:opacity-95 transition"
            >
              Deploy Agentic Tier ($45/mo)
            </Link>
          </div>
        </div>
      </section>

      <UniversalITFeedbackWidget toolSlug="gapscan" toolName="GapScan" />
    </div>
  );
}
