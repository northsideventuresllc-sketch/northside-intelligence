"use client";

export function SignalDeskBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Deep Telemetry Emerald & Amber Ambient Glows */}
      <div className="absolute -left-28 top-16 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl animate-pulse" />
      <div
        className="absolute -right-24 bottom-28 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl animate-pulse"
        style={{ animationDelay: "1.8s" }}
      />
      <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-teal-600/10 blur-3xl" />

      {/* Floating Live Signal Feed Badges */}
      {[
        { top: "18%", left: "10%", delay: "0s", label: "MARKET_PULSE: +34% MOMENTUM", color: "border-emerald-500/40 text-emerald-300" },
        { top: "60%", left: "82%", delay: "1.4s", label: "COMPETITOR: GITHUB RELEASE SPIKE", color: "border-amber-500/40 text-amber-300" },
        { top: "38%", left: "86%", delay: "2.6s", label: "THREAT_LEVEL: ELEVATED", color: "border-red-500/40 text-red-300" },
        { top: "76%", left: "14%", delay: "0.7s", label: "EMAIL_BRIEF: SCHEDULED 07:00", color: "border-teal-500/40 text-teal-300" },
      ].map((b, i) => (
        <div
          key={i}
          className={`absolute animate-float rounded-xl border bg-black/70 px-3 py-1.5 font-mono text-[10px] backdrop-blur-md ${b.color}`}
          style={{ top: b.top, left: b.left, animationDelay: b.delay }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{b.label}</span>
          </div>
        </div>
      ))}

      {/* High-Frequency Telemetry Waveform Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.18), transparent 60%), radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.12), transparent 50%)",
        }}
      />
    </div>
  );
}
