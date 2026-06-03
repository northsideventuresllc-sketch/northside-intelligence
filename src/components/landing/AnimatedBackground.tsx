"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      container.style.setProperty("--parallax-x", `${x * 20}px`);
      container.style.setProperty("--parallax-y", `${y * 20}px`);
      container.style.setProperty("--glow-x", `${e.clientX}px`);
      container.style.setProperty("--glow-y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={
        {
          "--parallax-x": "0px",
          "--parallax-y": "0px",
          "--glow-x": "50%",
          "--glow-y": "50%",
        } as React.CSSProperties
      }
      aria-hidden
    >
      {/* 3D perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] origin-bottom opacity-30"
        style={{
          transform: "perspective(600px) rotateX(65deg) translateY(var(--parallax-y))",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="h-full w-full animate-grid-pulse"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "linear-gradient(to top, black 20%, transparent 100%)",
          }}
        />
      </div>

      {/* Interactive cursor glow */}
      <div
        className="absolute h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl transition-opacity duration-300"
        style={{
          left: "var(--glow-x)",
          top: "var(--glow-y)",
          background: "radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, transparent 70%)",
        }}
      />

      {/* Ambient orbs with parallax */}
      <div
        className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
        style={{ transform: `translate(calc(-50% + var(--parallax-x)), var(--parallax-y))` }}
      />
      <div
        className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl"
        style={{ transform: `translate(calc(var(--parallax-x) * -0.5), calc(var(--parallax-y) * -0.5))` }}
      />

      {/* Floating particles */}
      {[
        { top: "18%", left: "12%", delay: "0s", size: "h-1.5 w-1.5" },
        { top: "55%", left: "85%", delay: "1.5s", size: "h-1 w-1" },
        { top: "35%", left: "60%", delay: "3s", size: "h-2 w-2" },
        { top: "72%", left: "25%", delay: "4.5s", size: "h-1 w-1" },
        { top: "28%", left: "78%", delay: "2s", size: "h-1.5 w-1.5" },
      ].map((p, i) => (
        <span
          key={i}
          className={`absolute ${p.size} rounded-full bg-cyan-400/50 shadow-[0_0_8px_rgba(0,212,255,0.6)] animate-float`}
          style={{ top: p.top, left: p.left, animationDelay: p.delay }}
        />
      ))}

      {/* Scan line */}
      <div className="absolute inset-x-0 top-0 h-px animate-scan-line bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
    </div>
  );
}
