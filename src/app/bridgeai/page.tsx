import Link from "next/link";
import { BridgeAIBackground } from "@/components/bridgeai/BridgeAIBackground";
import { BridgeAINav } from "@/components/bridgeai/BridgeAINav";
import { UniversalITFeedbackWidget } from "@/components/feedback/UniversalITFeedbackWidget";

export default function BridgeAILandingPage() {
  return (
    <div className="relative min-h-screen bg-[#07090e] text-white selection:bg-purple-500/30 selection:text-purple-200">
      <BridgeAIBackground />
      <BridgeAINav />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-mono text-purple-300">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>AUTONOMOUS API SYNAPSE & FASTMCP BRIDGE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Bridge Any Two APIs. <br />
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Compile Production Code & FastMCP Tools.
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed font-sans">
          BridgeAI generates resilient, production-ready serverless integration scripts in Node.js and Python, complete with webhook signatures, retries, and native FastMCP schemas for Antigravity, Claude Code, and Cursor.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/bridgeai/dashboard"
            className="rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 px-8 py-4 text-sm font-bold text-white shadow-[0_0_35px_rgba(138,43,226,0.4)] transition hover:opacity-90"
          >
            Launch BridgeAI Studio →
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
          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-purple-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-white">Dual-Language Endpoints</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Generates typed TypeScript and async Python code with Pydantic validation, webhook signature verification, and idempotency guarantees.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-cyan-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-2xl">
              🔌
            </div>
            <h3 className="text-xl font-bold text-white">Native FastMCP Schemas</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Export MCP tool schemas formatted specifically for AI agent harnesses. Equip Claude Code and Google Antigravity to trigger your custom APIs.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-blue-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-2xl">
              🔄
            </div>
            <h3 className="text-xl font-bold text-white">Autonomous Agentic Routing</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Deploy dedicated headless background workers with persistent agent keys that monitor webhooks and manage multi-step data transformations.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Tier Model & Pricing Section */}
      <section id="pricing" className="relative z-10 mx-auto max-w-5xl px-6 py-20 border-t border-white/10">
        <div className="text-center space-y-3 mb-12">
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-mono text-purple-300 uppercase tracking-wider">
            Clear 3-Tier Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Predictable, High-Impact Pricing</h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            From single-recipe generators to autonomous enterprise MCP server hosting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="rounded-3xl border border-white/10 bg-black/50 p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-white/50 tracking-wider">Community Tier</span>
              <h3 className="text-2xl font-bold text-white mt-1">Free Sandbox</h3>
              <p className="text-xs text-white/60 mt-2">Generate and test API bridges.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-white/50"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-white/70">
                <li className="flex items-center gap-2"><span className="text-purple-400">✓</span> 10 Recipes / month</li>
                <li className="flex items-center gap-2"><span className="text-purple-400">✓</span> Node.js & Python Scripts</li>
                <li className="flex items-center gap-2"><span className="text-purple-400">✓</span> Standard Webhook Templates</li>
              </ul>
            </div>
            <Link
              href="/bridgeai/dashboard"
              className="mt-8 block text-center py-3 rounded-xl border border-white/20 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Start Free Building
            </Link>
          </div>

          {/* SaaS Tier */}
          <div className="rounded-3xl border border-white/20 bg-black/70 p-8 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-xs font-mono uppercase text-purple-400 tracking-wider">SaaS Standard</span>
              <h3 className="text-2xl font-bold text-white mt-1">SaaS Unlimited</h3>
              <p className="text-xs text-white/60 mt-2">Unlimited orchestration & FastMCP export.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$29</span>
                <span className="text-xs text-white/50"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-white/80">
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Unlimited Bridge Recipes</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Export FastMCP JSON Schemas</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Custom BYOK LLM Routing</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Saved Cloud Workspace History</li>
              </ul>
            </div>
            <Link
              href="/auth/signup?returnTo=/bridgeai/dashboard"
              className="mt-8 block text-center py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-xs font-bold text-white shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:opacity-95 transition"
            >
              Subscribe SaaS ($29/mo)
            </Link>
          </div>

          {/* Agentic Tier (Featured) */}
          <div className="relative rounded-3xl border-2 border-purple-500/70 bg-purple-950/20 p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(138,43,226,0.25)]">
            <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
              Highest Leverage
            </span>
            <div>
              <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Agentic Headless</span>
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Autonomous Agent</h3>
              <p className="text-xs text-white/60 mt-2">Dedicated agent key & hosted MCP server.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$69</span>
                <span className="text-xs text-white/50"> / month</span>
                <p className="text-[10px] text-cyan-400/80 mt-1">Includes 2.5x compute & dedicated API key</p>
              </div>
              <ul className="space-y-3 text-xs text-white/90">
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Everything in SaaS Standard</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Dedicated Agent Key (ni_agt_...)</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Hosted FastMCP Server Endpoint</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Background Headless Webhook Worker</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Multi-LLM Fallback (Gemini/Claude/AXON)</li>
              </ul>
            </div>
            <Link
              href="/auth/signup?returnTo=/bridgeai/settings"
              className="mt-8 block text-center py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-xs font-black text-white shadow-[0_0_25px_rgba(138,43,226,0.4)] hover:opacity-95 transition"
            >
              Deploy Agentic Tier ($69/mo)
            </Link>
          </div>
        </div>
      </section>

      <UniversalITFeedbackWidget toolSlug="bridgeai" toolName="BridgeAI" />
    </div>
  );
}
