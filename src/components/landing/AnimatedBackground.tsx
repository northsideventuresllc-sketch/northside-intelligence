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
      container.style.setProperty("--parallax-x", `${x * 28}px`);
      container.style.setProperty("--parallax-y", `${y * 28}px`);
      container.style.setProperty("--parallax-x-neg", `${x * -18}px`);
      container.style.setProperty("--parallax-y-neg", `${y * -18}px`);
      container.style.setProperty("--glow-x", `${e.clientX}px`);
      container.style.setProperty("--glow-y", `${e.clientY}px`);
      container.style.setProperty("--tilt-x", `${-y * 6}deg`);
      container.style.setProperty("--tilt-y", `${x * 6}deg`);
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
          "--parallax-x-neg": "0px",
          "--parallax-y-neg": "0px",
          "--glow-x": "50%",
          "--glow-y": "50%",
          "--tilt-x": "0deg",
          "--tilt-y": "0deg",
        } as React.CSSProperties
      }
      aria-hidden
    >
      {/* Deep 3D perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[70%] origin-bottom opacity-40"
        style={{
          transform:
            "perspective(500px) rotateX(72deg) rotateZ(0deg) translateY(var(--parallax-y))",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="h-full w-full animate-grid-pulse"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.18) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.18) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            maskImage: "linear-gradient(to top, black 10%, transparent 100%)",
          }}
        />
      </div>

      {/* Secondary grid layer for depth */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] origin-bottom opacity-20"
        style={{
          transform:
            "perspective(700px) rotateX(68deg) translateY(calc(var(--parallax-y) * 0.5))",
        }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to top, black 5%, transparent 90%)",
          }}
        />
      </div>

      {/* Floating hex plate */}
      <div
        className="absolute left-1/2 top-[28%] h-64 w-64 -translate-x-1/2 animate-orbit-slow rounded-full border border-cyan-400/10"
        style={{
          transform: `translate(calc(-50% + var(--parallax-x)), var(--parallax-y)) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))`,
          boxShadow: "0 0 60px rgba(0,212,255,0.08), inset 0 0 40px rgba(0,212,255,0.05)",
        }}
      />

      {/* Interactive cursor glow */}
      <div
        className="absolute h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          left: "var(--glow-x)",
          top: "var(--glow-y)",
          background: "radial-gradient(circle, rgba(0, 212, 255, 0.35) 0%, transparent 70%)",
        }}
      />

      {/* Ambient orbs with parallax */}
      <div
        className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
        style={{ transform: `translate(calc(-50% + var(--parallax-x)), var(--parallax-y))` }}
      />
      <div
        className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl"
        style={{
          transform: `translate(var(--parallax-x-neg), var(--parallax-y-neg))`,
        }}
      />
      <div
        className="absolute left-0 top-1/4 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl"
        style={{
          transform: `translate(calc(var(--parallax-x) * 0.3), calc(var(--parallax-y) * 0.6))`,
        }}
      />

      {/* Floating particles */}
      {[
        { top: "18%", left: "12%", delay: "0s", size: "h-1.5 w-1.5", depth: "20px" },
        { top: "55%", left: "85%", delay: "1.5s", size: "h-1 w-1", depth: "40px" },
        { top: "35%", left: "60%", delay: "3s", size: "h-2 w-2", depth: "60px" },
        { top: "72%", left: "25%", delay: "4.5s", size: "h-1 w-1", depth: "30px" },
        { top: "28%", left: "78%", delay: "2s", size: "h-1.5 w-1.5", depth: "50px" },
      ].map((p, i) => (
        <span
          key={i}
          className={`absolute ${p.size} rounded-full bg-cyan-400/50 shadow-[0_0_8px_rgba(0,212,255,0.6)] animate-float`}
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            transform: `translateZ(${p.depth})`,
          }}
        />
      ))}

      {/* Scan line */}
      <div className="absolute inset-x-0 top-0 h-px animate-scan-line bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

      {/* Vignette depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,8,12,0.4)_100%)]" />
    </div>
  );
}
