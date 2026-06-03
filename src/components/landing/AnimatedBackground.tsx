"use client";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.12] animate-grid-pulse"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/5 blur-3xl" />
      {[
        { top: "20%", left: "15%", delay: "0s" },
        { top: "60%", left: "80%", delay: "2s" },
        { top: "40%", left: "55%", delay: "4s" },
      ].map((p, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-cyan-400/40 animate-float"
          style={{ top: p.top, left: p.left, animationDelay: p.delay }}
        />
      ))}
    </div>
  );
}
