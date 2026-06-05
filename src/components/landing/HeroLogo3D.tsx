"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export function HeroLogo3D() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rotationRef = useRef({ x: -8, y: 14, z: 0 });
  const [loaded, setLoaded] = useState(false);

  const applyTransform = useCallback(() => {
    const logo = logoRef.current;
    if (!logo) return;
    const { x, y, z } = rotationRef.current;
    logo.style.transform = `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = scene.getBoundingClientRect();
      const point = "touches" in e ? e.touches[0] : e;
      if (!point) return;
      pointerRef.current = {
        x: (point.clientX - rect.left) / rect.width - 0.5,
        y: (point.clientY - rect.top) / rect.height - 0.5,
        active: true,
      };
    };

    const onLeave = () => {
      pointerRef.current.active = false;
    };

    const tick = () => {
      const { x, y, active } = pointerRef.current;
      const targetX = active ? -y * 24 - 6 : -8;
      const targetY = active ? x * 32 + 14 : 14;
      rotationRef.current.x += (targetX - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetY - rotationRef.current.y) * 0.08;
      if (!active) rotationRef.current.y += 0.06;
      applyTransform();
      rafRef.current = requestAnimationFrame(tick);
    };

    scene.addEventListener("mousemove", onMove);
    scene.addEventListener("touchmove", onMove, { passive: true });
    scene.addEventListener("mouseleave", onLeave);
    scene.addEventListener("touchend", onLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      scene.removeEventListener("mousemove", onMove);
      scene.removeEventListener("touchmove", onMove);
      scene.removeEventListener("mouseleave", onLeave);
      scene.removeEventListener("touchend", onLeave);
    };
  }, [applyTransform]);

  return (
    <div
      ref={sceneRef}
      className="relative mx-auto h-[360px] w-full max-w-md sm:h-[420px] sm:max-w-lg"
      style={{ perspective: "1600px", transformStyle: "preserve-3d" }}
      aria-label="Interactive Northside Intelligence logo"
    >
      {/* Orbital rings */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-[1400ms] ease-out ${
          loaded ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
        style={{ transformStyle: "preserve-3d" }}
        aria-hidden
      >
        <div
          className="absolute h-72 w-72 animate-orbit rounded-full border border-cyan-400/15 sm:h-80 sm:w-80"
          style={{ transform: "translateZ(-90px) rotateX(72deg)" }}
        />
        <div
          className="absolute h-56 w-56 animate-orbit-reverse rounded-full border border-purple-400/15"
          style={{ transform: "translateZ(-50px) rotateX(58deg) rotateY(18deg)" }}
        />
      </div>

      <div
        ref={logoRef}
        className={`absolute inset-0 flex items-center justify-center will-change-transform transition-all duration-[1200ms] ease-out ${
          loaded ? "scale-100 opacity-100" : "scale-[0.55] opacity-0"
        }`}
        style={{
          transformStyle: "preserve-3d",
          transitionDelay: loaded ? "0ms" : "0ms",
        }}
      >
        {/* Depth layers — light field only, no solid card */}
        <div
          className="pointer-events-none absolute h-64 w-52 sm:h-72 sm:w-60"
          style={{
            transform: "translateZ(-70px) scale(0.88)",
            background:
              "radial-gradient(ellipse at center, rgba(0,212,255,0.12) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute h-64 w-52 sm:h-72 sm:w-60"
          style={{
            transform: "translateZ(-35px) scale(0.94)",
            background:
              "radial-gradient(ellipse at center, rgba(155,127,212,0.08) 0%, transparent 65%)",
            filter: "blur(4px)",
          }}
          aria-hidden
        />

        {/* Chroma-keyed logo — transparent background, light field + text only */}
        <div
          className={`relative ${loaded ? "animate-logo-reveal" : ""}`}
          style={{
            transform: "translateZ(50px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src="/logo-chroma.svg"
            alt="Northside Intelligence"
            width={320}
            height={420}
            className="h-auto w-48 object-contain drop-shadow-[0_0_50px_rgba(0,212,255,0.5)] sm:w-56 md:w-64"
            priority
            onLoad={() => setLoaded(true)}
          />
          {/* Specular edge highlights */}
          <div
            className="pointer-events-none absolute inset-y-8 -right-1 w-2 rounded-r-full bg-gradient-to-r from-cyan-400/25 to-transparent"
            style={{ transform: "translateZ(12px)" }}
            aria-hidden
          />
        </div>
      </div>

      {/* Ground glow */}
      <div
        className={`pointer-events-none absolute bottom-6 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-[100%] bg-cyan-500/20 blur-2xl transition-opacity duration-[1400ms] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ transform: "translateZ(-110px) rotateX(80deg)" }}
        aria-hidden
      />
    </div>
  );
}
