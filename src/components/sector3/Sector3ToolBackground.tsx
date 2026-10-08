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
    </div>
  );
}
