"use client";

export function BridgeAIBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* Quantum Violet & Cyan Ambient Synapse Glows */}
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl animate-pulse" />
      <div
        className="absolute -right-28 bottom-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Floating Synapse Connection Nodes */}
      {[
        { top: "20%", left: "10%", delay: "0s", label: "STRIPE ➜ SUPABASE", color: "border-purple-500/40 text-purple-300" },
        { top: "65%", left: "80%", delay: "1.5s", label: "HUBSPOT ➜ RESEND", color: "border-cyan-500/40 text-cyan-300" },
        { top: "35%", left: "85%", delay: "2.8s", label: "FASTMCP ➜ CLAUDE", color: "border-blue-500/40 text-blue-300" },
        { top: "80%", left: "15%", delay: "0.9s", label: "ZAPIER ➜ SLACK", color: "border-teal-500/40 text-teal-300" },
      ].map((b, i) => (
        <div
          key={i}
          className={`absolute animate-float rounded-xl border bg-black/70 px-3 py-1.5 font-mono text-[10px] backdrop-blur-md ${b.color}`}
          style={{ top: b.top, left: b.left, animationDelay: b.delay }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{b.label}</span>
          </div>
        </div>
      ))}

      {/* Circuit / Neural Flow Lines Overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(138, 43, 226, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 212, 0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(138, 43, 226, 0.2), transparent 60%), radial-gradient(circle at 100% 100%, rgba(0, 245, 212, 0.12), transparent 50%)",
        }}
      />
    </div>
  );
}
