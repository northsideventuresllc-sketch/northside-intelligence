"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

export function HeroLogo3D() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rotationRef = useRef({ x: -6, y: 12, z: 0 });

  const applyTransform = useCallback(() => {
    const logo = logoRef.current;
    if (!logo) return;
    const { x, y, z } = rotationRef.current;
    logo.style.transform = `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
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
      const targetX = active ? -y * 22 - 4 : -6;
      const targetY = active ? x * 28 + 12 : 12;
      rotationRef.current.x += (targetX - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetY - rotationRef.current.y) * 0.08;
      if (!active) rotationRef.current.y += 0.08;
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
      className="relative mx-auto h-[340px] w-full max-w-md sm:h-[400px] sm:max-w-lg"
      style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
      aria-label="Interactive Northside Intelligence logo"
    >
      {/* Orbital hex rings */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
        aria-hidden
      >
        <div
          className="absolute h-72 w-72 animate-orbit rounded-full border border-cyan-400/15 sm:h-80 sm:w-80"
          style={{ transform: "translateZ(-80px) rotateX(70deg)" }}
        />
        <div
          className="absolute h-56 w-56 animate-orbit-reverse rounded-full border border-purple-400/15"
          style={{ transform: "translateZ(-40px) rotateX(55deg) rotateY(20deg)" }}
        />
      </div>

      <div
        ref={logoRef}
        className="absolute inset-0 flex items-center justify-center transition-transform duration-100 will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back plate depth */}
        <div
          className="absolute h-64 w-48 rounded-3xl border border-cyan-500/10 bg-ni-navy/40 sm:h-72 sm:w-56"
          style={{
            transform: "translateZ(-60px) scale(0.92)",
            boxShadow: "0 0 80px rgba(0,212,255,0.12)",
          }}
          aria-hidden
        />
        <div
          className="absolute h-64 w-48 rounded-3xl border border-cyan-500/15 bg-ni-navy/30 sm:h-72 sm:w-56"
          style={{ transform: "translateZ(-30px) scale(0.96)" }}
          aria-hidden
        />

        {/* Main logo face */}
        <div
          className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-ni-navy/70 to-ni-bg/90 p-4 shadow-[0_30px_80px_rgba(0,212,255,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md sm:p-5"
          style={{
            transform: "translateZ(40px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src="/logo-full.png"
            alt="Northside Intelligence"
            width={320}
            height={420}
            className="h-auto w-44 object-contain drop-shadow-[0_0_40px_rgba(0,212,255,0.45)] sm:w-52 md:w-60"
            priority
          />
          {/* Edge highlights for 3D depth */}
          <div
            className="pointer-events-none absolute inset-y-4 -right-2 w-3 rounded-r-xl bg-gradient-to-r from-cyan-400/20 to-transparent"
            style={{ transform: "translateZ(8px)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-4 -left-2 w-3 rounded-l-xl bg-gradient-to-l from-cyan-400/10 to-transparent"
            style={{ transform: "translateZ(-8px)" }}
            aria-hidden
          />
        </div>

        {/* Floating emblem accent */}
        <div
          className="absolute -top-2 right-4 sm:right-8"
          style={{ transform: "translateZ(80px)" }}
          aria-hidden
        >
          <Image
            src="/ni-emblem.svg"
            alt=""
            width={48}
            height={48}
            className="h-10 w-10 opacity-80 drop-shadow-[0_0_16px_rgba(0,212,255,0.6)] sm:h-12 sm:w-12"
          />
        </div>
      </div>

      {/* Ground reflection */}
      <div
        className="pointer-events-none absolute bottom-4 left-1/2 h-10 w-3/4 -translate-x-1/2 rounded-[100%] bg-cyan-500/15 blur-2xl"
        style={{ transform: "translateZ(-100px) rotateX(80deg)" }}
        aria-hidden
      />
    </div>
  );
}
