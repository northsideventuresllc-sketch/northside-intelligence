"use client";

import { useEffect, useRef } from "react";

interface Logo3DProps {
  variant?: "full" | "emblem";
  className?: string;
}

/**
 * Sculptural 3D NI mark — CSS geometry only (no photo, no enclosing frame).
 */
export function Logo3D({ variant = "full", className = "" }: Logo3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isFull = variant === "full";
  const size = isFull ? "h-40 w-40 sm:h-52 sm:w-52 md:h-64 md:w-64" : "h-14 w-14 sm:h-16 sm:w-16";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${-y * 16}deg) rotateY(${x * 16}deg)`;
    };

    const handleLeave = () => {
      el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`group relative transition-transform duration-500 ease-out will-change-transform ${size} ${className}`}
      style={{ transformStyle: "preserve-3d" }}
      aria-label="Northside Intelligence"
      role="img"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full bg-cyan-400/20 blur-3xl transition-opacity duration-500 group-hover:bg-cyan-300/30"
        style={{ transform: "translateZ(-60px) scale(1.2)" }}
        aria-hidden
      />

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Outer orbital ring */}
        <div
          className="absolute inset-[8%] rounded-full border border-cyan-400/25"
          style={{
            transform: "translateZ(-24px) rotateX(72deg)",
            boxShadow: "0 0 40px rgba(0,212,255,0.15), inset 0 0 30px rgba(0,212,255,0.08)",
          }}
          aria-hidden
        />
        {/* Inner ring */}
        <div
          className="absolute inset-[22%] rounded-full border border-cyan-300/40"
          style={{ transform: "translateZ(-8px)" }}
          aria-hidden
        />
        {/* Axis cross */}
        <div
          className="absolute left-1/2 top-[12%] h-[76%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent"
          style={{ transform: "translateZ(-16px)" }}
          aria-hidden
        />
        <div
          className="absolute left-[12%] top-1/2 h-px w-[76%] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
          style={{ transform: "translateZ(-16px)" }}
          aria-hidden
        />

        {/* 3D monogram layers */}
        <div
          className="relative flex items-center justify-center gap-0.5 font-bold tracking-tighter text-cyan-300"
          style={{ transformStyle: "preserve-3d" }}
        >
          {["N", "I"].map((letter, i) => (
            <span key={letter} className="relative" style={{ transformStyle: "preserve-3d" }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((layer) => (
                <span
                  key={layer}
                  className={`absolute inset-0 flex items-center justify-center select-none ${
                    isFull ? "text-5xl sm:text-6xl md:text-7xl" : "text-xl sm:text-2xl"
                  }`}
                  style={{
                    transform: `translateZ(${layer * 2}px)`,
                    color: layer === 7 ? "#e0faff" : `rgba(0, 212, 255, ${0.15 + layer * 0.1})`,
                    textShadow:
                      layer === 7
                        ? "0 0 30px rgba(0,212,255,0.8), 0 0 60px rgba(0,212,255,0.4)"
                        : "none",
                  }}
                  aria-hidden={layer !== 7}
                >
                  {letter}
                </span>
              ))}
            </span>
          ))}
        </div>

        {/* Core gem */}
        <div
          className="absolute h-[18%] w-[18%] rounded-full bg-cyan-400/30 blur-sm"
          style={{
            transform: "translateZ(28px)",
            boxShadow: "0 0 50px rgba(0,212,255,0.6)",
          }}
          aria-hidden
        />
      </div>

      <div
        className="pointer-events-none absolute -bottom-[12%] left-1/2 h-6 w-2/3 -translate-x-1/2 rounded-[100%] bg-cyan-500/25 blur-xl"
        style={{ transform: "translateZ(-40px) rotateX(85deg)" }}
        aria-hidden
      />
    </div>
  );
}
