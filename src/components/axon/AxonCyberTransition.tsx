"use client";

import { useEffect } from "react";

interface AxonCyberTransitionProps {
  onComplete: () => void;
}

export function AxonCyberTransition({ onComplete }: AxonCyberTransitionProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6">
      <div className="axon-scanlines pointer-events-none absolute inset-0 opacity-40" />
      <div className="axon-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative z-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300/70">
          Access Granted
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          <span className="axon-glitch inline-block">AXON</span>
        </h2>
        <p className="mt-3 text-sm text-ni-muted">Loading command environment…</p>
      </div>
    </div>
  );
}
