"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

interface Logo3DProps {
  variant?: "full" | "emblem";
  className?: string;
  priority?: boolean;
}

export function Logo3D({ variant = "full", className = "", priority = false }: Logo3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${-y * 14}deg) rotateY(${x * 14}deg) translateZ(30px)`;
    };

    const handleLeave = () => {
      el.style.transform =
        "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const src = variant === "full" ? "/logo-full.png" : "/logo.png";
  const dimensions =
    variant === "full"
      ? { width: 320, height: 400, imgClass: "h-auto w-56 sm:w-72 md:w-80" }
      : { width: 120, height: 120, imgClass: "h-16 w-16 sm:h-20 sm:w-20" };

  return (
    <div
      ref={ref}
      className={`group relative transition-transform duration-300 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="pointer-events-none absolute -inset-8 rounded-full bg-cyan-500/10 blur-3xl transition-opacity duration-500 group-hover:bg-cyan-400/20"
        style={{ transform: "translateZ(-40px)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl border border-cyan-400/20 opacity-60"
        style={{
          transform: "translateZ(-20px) scale(1.08)",
          boxShadow: "0 0 80px rgba(0,212,255,0.15)",
        }}
        aria-hidden
      />
      <div
        className="relative rounded-3xl border border-cyan-500/25 bg-ni-navy/30 p-3 shadow-[0_20px_60px_rgba(0,212,255,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm"
        style={{ transform: "translateZ(10px)" }}
      >
        <Image
          src={src}
          alt="Northside Intelligence logo"
          width={dimensions.width}
          height={dimensions.height}
          className={`${dimensions.imgClass} object-contain drop-shadow-[0_0_30px_rgba(0,212,255,0.45)]`}
          priority={priority}
        />
      </div>
      <div
        className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-[100%] bg-cyan-500/20 blur-xl"
        style={{ transform: "translateZ(-30px) rotateX(80deg)" }}
        aria-hidden
      />
    </div>
  );
}
