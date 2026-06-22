"use client";

export function GrantBotBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-gb-emerald/10 blur-3xl animate-pulse-glow" />
      <div
        className="absolute -right-24 bottom-32 h-80 w-80 rounded-full bg-gb-amber/10 blur-3xl animate-pulse-glow"
        style={{ animationDelay: "1s" }}
      />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-gb-teal/10 blur-3xl" />

      {[
        { top: "16%", left: "10%", delay: "0s", w: "w-28" },
        { top: "58%", left: "80%", delay: "1.4s", w: "w-32" },
        { top: "42%", left: "88%", delay: "2.2s", w: "w-24" },
        { top: "74%", left: "14%", delay: "0.6s", w: "w-30" },
      ].map((b, i) => (
        <div
          key={i}
          className={`absolute ${b.w} animate-float-bubble rounded-2xl border border-gb-emerald/20 bg-gb-card/40 px-3 py-2 text-[10px] text-gb-muted/60`}
          style={{ top: b.top, left: b.left, animationDelay: b.delay }}
        >
          <div className="mb-1 h-1.5 w-8 rounded-full bg-gb-emerald/30" />
          <div className="h-1 w-full rounded-full bg-white/10" />
          <div className="mt-1 h-1 w-2/3 rounded-full bg-white/5" />
        </div>
      ))}

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(52,211,153,0.12), transparent 50%), radial-gradient(circle at 100% 100%, rgba(251,191,36,0.08), transparent 40%)",
        }}
      />
    </div>
  );
}
