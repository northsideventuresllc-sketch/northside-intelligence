"use client";

import { getToolBrand } from "@/lib/constants";

interface Props {
  slug: string;
}

export function Sector3ToolBackground({ slug }: Props) {
  const brand = getToolBrand(slug);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-32 top-20 h-96 w-96 rounded-full blur-3xl animate-pulse-glow"
        style={{ backgroundColor: `${brand.brandColor}1a` }}
      />
      <div
        className="absolute -right-24 bottom-32 h-80 w-80 rounded-full blur-3xl animate-pulse-glow"
        style={{ backgroundColor: `${brand.brandColor}14`, animationDelay: "1s" }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, ${brand.brandColor}22, transparent 50%)`,
        }}
      />

      {[
        { top: "16%", left: "10%", delay: "0s", w: "w-28" },
        { top: "58%", left: "80%", delay: "1.4s", w: "w-32" },
        { top: "42%", left: "88%", delay: "2.2s", w: "w-24" },
        { top: "74%", left: "14%", delay: "0.6s", w: "w-32" },
      ].map((b, i) => (
        <div
          key={i}
          className={`absolute ${b.w} animate-float-bubble rounded-2xl border bg-black/40 px-3 py-2`}
          style={{ 
            top: b.top, 
            left: b.left, 
            animationDelay: b.delay,
            borderColor: `${brand.brandColor}40`
          }}
        >
          <div className="mb-1 h-1.5 w-8 rounded-full opacity-60" style={{ backgroundColor: brand.brandColor }} />
          <div className="h-1 w-full rounded-full bg-white/10" />
          <div className="mt-1 h-1 w-2/3 rounded-full bg-white/5" />
        </div>
      ))}
    </div>
  );
}
