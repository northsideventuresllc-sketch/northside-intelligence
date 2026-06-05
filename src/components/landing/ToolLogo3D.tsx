"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

interface ToolLogo3DProps {
  logo: string;
  name: string;
  brandColor: string;
  size?: "sm" | "md" | "lg";
}

export function ToolLogo3D({ logo, name, brandColor, size = "md" }: ToolLogo3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const rotationRef = useRef({ x: -4, y: 8 });

  const sizeClass =
    size === "sm" ? "h-14 w-14" : size === "lg" ? "h-24 w-24" : "h-20 w-20";
  const imgSize = size === "sm" ? 56 : size === "lg" ? 96 : 80;

  const applyTransform = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { x, y } = rotationRef.current;
    el.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotationRef.current = { x: -py * 18 - 4, y: px * 22 + 8 };
    };

    const onLeave = () => {
      rotationRef.current = { x: -4, y: 8 };
    };

    const tick = () => {
      applyTransform();
      rafRef.current = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [applyTransform]);

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ perspective: "800px" }}
    >
      <div
        ref={ref}
        className={`relative flex items-center justify-center rounded-2xl border p-3 transition-transform duration-100 will-change-transform ${sizeClass}`}
        style={{
          transformStyle: "preserve-3d",
          borderColor: `${brandColor}55`,
          background: `linear-gradient(135deg, ${brandColor}18, transparent 60%)`,
          boxShadow: `0 12px 40px ${brandColor}33, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        <div style={{ transform: "translateZ(20px)" }}>
          <Image
            src={logo}
            alt={`${name} logo`}
            width={imgSize}
            height={imgSize}
            className="h-full w-full object-contain"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
          style={{
            transform: "translateZ(-8px) scale(0.92)",
            background: `radial-gradient(circle, ${brandColor}44, transparent 70%)`,
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
