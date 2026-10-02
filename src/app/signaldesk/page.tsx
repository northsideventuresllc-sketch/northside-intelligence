import Link from "next/link";
import { SignalDeskBackground } from "@/components/signaldesk/SignalDeskBackground";
import { SignalDeskNav } from "@/components/signaldesk/SignalDeskNav";
import { UniversalITFeedbackWidget } from "@/components/feedback/UniversalITFeedbackWidget";

export default function SignalDeskLandingPage() {
  return (
    <div className="relative min-h-screen bg-[#07090e] text-white selection:bg-emerald-500/30 selection:text-emerald-200">
      <SignalDeskBackground />
      <SignalDeskNav />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>AUTONOMOUS COMPETITOR TELEMETRY & MARKET RADAR</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Track Every Market Shift. <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            Intercept Competitor Moves in Real Time.
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed font-sans">
          Signal Desk scans web media, HackerNews, ProductHunt, and GitHub release velocity to compile C-suite threat assessments and actionable tactical countermeasures delivered directly to your inbox.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/signaldesk/dashboard"
            className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-[0_0_35px_rgba(16,185,129,0.4)] transition hover:opacity-90"
          >
            Launch Telemetry Feed →
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
          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-emerald-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-2xl">
              📡
            </div>
            <h3 className="text-xl font-bold text-white">Multi-Source Radar</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Synthesizes news articles, PR announcements, startup launches, and developer release activity into unified intelligence streams.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-amber-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-2xl">
              🎯
            </div>
            <h3 className="text-xl font-bold text-white">Threat-Level Assessments</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Instantly categorizes industry events into LOW, ELEVATED, or CRITICAL threat levels with specific immediate countermeasures.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl space-y-4 hover:border-teal-500/40 transition">
            <div className="h-12 w-12 rounded-2xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-center text-2xl">
              📬
            </div>
            <h3 className="text-xl font-bold text-white">Autonomous Email Dispatch</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Sends beautifully formatted executive markdown dossiers via Resend directly to your inbox every morning or on-demand.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Tier Model & Pricing Section */}
      <section id="pricing" className="relative z-10 mx-auto max-w-5xl px-6 py-20 border-t border-white/10">
        <div className="text-center space-y-3 mb-12">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-300 uppercase tracking-wider">
            Clear 3-Tier Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Predictable, Transparent Pricing</h2>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            From single-query telemetry to 24/7 autonomous market monitoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Tier */}
          <div className="rounded-3xl border border-white/10 bg-black/50 p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-white/50 tracking-wider">Community Telemetry</span>
              <h3 className="text-2xl font-bold text-white mt-1">Free Tier</h3>
              <p className="text-xs text-white/60 mt-2">Single-query market checks.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-white/50"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-white/70">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 10 Signal Briefs / month</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Real-Time Web News Search</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Standard Threat Level Rating</li>
              </ul>
            </div>
            <Link
              href="/signaldesk/dashboard"
              className="mt-8 block text-center py-3 rounded-xl border border-white/20 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Start Free Feed
            </Link>
          </div>

          {/* SaaS Tier */}
          <div className="rounded-3xl border border-white/20 bg-black/70 p-8 flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">SaaS Standard</span>
              <h3 className="text-2xl font-bold text-white mt-1">SaaS Unlimited</h3>
              <p className="text-xs text-white/60 mt-2">Full intelligence briefings & email alerts.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$24</span>
                <span className="text-xs text-white/50"> / month</span>
              </div>
              <ul className="space-y-3 text-xs text-white/80">
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Unlimited Signal Dossiers</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Multi-Source Feed (HN, GitHub, Web)</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Resend Automated Email Dispatch</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Saved Signal History & Tracking</li>
              </ul>
            </div>
            <Link
              href="/auth/signup?returnTo=/signaldesk/dashboard"
              className="mt-8 block text-center py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-95 transition"
            >
              Subscribe SaaS ($24/mo)
            </Link>
          </div>

          {/* Agentic Tier (Featured) */}
          <div className="relative rounded-3xl border-2 border-emerald-500/70 bg-emerald-950/20 p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(16,185,129,0.25)]">
            <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-emerald-600 to-amber-500 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
              Highest Leverage
            </span>
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Agentic Headless</span>
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Autonomous Agent</h3>
              <p className="text-xs text-white/60 mt-2">24/7 background radar & webhook triggers.</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-white">$59</span>
                <span className="text-xs text-white/50"> / month</span>
                <p className="text-[10px] text-emerald-400/80 mt-1">Includes 2.5x compute & dedicated API key</p>
              </div>
              <ul className="space-y-3 text-xs text-white/90">
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Everything in SaaS Standard</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Dedicated Agent Key (ni_agt_...)</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> FastMCP Schema for Claude/Cursor/AGY</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Scheduled Daily/Weekly Headless Runs</li>
                <li className="flex items-center gap-2"><span className="text-cyan-400 font-bold">✓</span> Real-Time Slack / Discord Webhooks</li>
              </ul>
            </div>
            <Link
              href="/auth/signup?returnTo=/signaldesk/settings"
              className="mt-8 block text-center py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 text-xs font-black text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:opacity-95 transition"
            >
              Deploy Agentic Tier ($59/mo)
            </Link>
          </div>
        </div>
      </section>

      <UniversalITFeedbackWidget toolSlug="signaldesk" toolName="Signal Desk" />
    </div>
  );
}
