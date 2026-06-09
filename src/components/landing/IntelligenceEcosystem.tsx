"use client";

import { EcosystemCarousel } from "./EcosystemCarousel";

export function IntelligenceEcosystem() {
  return (
    <section id="ecosystem" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.04)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Ecosystem
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
              Intelligence Ecosystem
            </span>
          </h2>
        </div>

        <div className="mb-10 text-center">
          <h3 className="text-lg font-medium text-white sm:text-xl">
            The Northside Intelligence Labs
          </h3>
          <p className="mt-1 text-[11px] tracking-wide text-ni-muted/80">thenilabs.com</p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
            Live ventures and confirmed products in development.
          </p>
        </div>

        <EcosystemCarousel />
      </div>
    </section>
  );
}
