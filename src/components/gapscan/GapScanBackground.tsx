"use client";

export function GapScanBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Ambient Neon Crimson & Amber Glows */}
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-red-600/10 blur-3xl animate-pulse" />
      <div
        className="absolute -right-24 bottom-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />
      <div className="absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-600/10 blur-3xl" />

      {/* Floating HUD Vulnerability Target Blips */}
      {[
        { top: "18%", left: "12%", delay: "0s", label: "LATENCY_GAP [420ms]", color: "border-red-500/30 text-red-400" },
        { top: "62%", left: "82%", delay: "1.2s", label: "CHECKOUT_LEAK [-14%]", color: "border-amber-500/30 text-amber-400" },
        { top: "36%", left: "88%", delay: "2.4s", label: "FORM_FRICTION [HIGH]", color: "border-orange-500/30 text-orange-400" },
        { top: "78%", left: "16%", delay: "0.8s", label: "SEO_DRIFT [FLAGGED]", color: "border-red-500/30 text-red-300" },
      ].map((b, i) => (
        <div
          key={i}
          className={`absolute animate-float rounded-xl border bg-black/60 px-3 py-1.5 font-mono text-[10px] backdrop-blur-md ${b.color}`}
          style={{ top: b.top, left: b.left, animationDelay: b.delay }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
            <span>{b.label}</span>
          </div>
        </div>
      ))}

      {/* Tech Grid & Subtle Radar Beam Effect */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 59, 48, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 59, 48, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(255, 59, 48, 0.15), transparent 60%), radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.1), transparent 50%)",
        }}
      />
    </div>
  );
}
