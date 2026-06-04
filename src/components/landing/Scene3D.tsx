"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Scene3DProps {
  children: ReactNode;
  className?: string;
}

export function Scene3D({ children, className = "" }: Scene3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      container.style.setProperty("--scene-rotate-y", `${x * 4}deg`);
      container.style.setProperty("--scene-rotate-x", `${-y * 3}deg`);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        {
          perspective: "1400px",
          transformStyle: "preserve-3d",
          "--scene-rotate-x": "0deg",
          "--scene-rotate-y": "0deg",
        } as React.CSSProperties
      }
    >
      <div
        className="transition-transform duration-700 ease-out will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "rotateX(var(--scene-rotate-x)) rotateY(var(--scene-rotate-y))",
        }}
      >
        {children}
      </div>
    </div>
  );
}
