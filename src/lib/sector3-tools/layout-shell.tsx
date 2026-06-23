import type { Metadata } from "next";
import { getToolBrand } from "@/lib/constants";
import type { Sector3ToolRuntimeConfig } from "@/lib/sector3-tools/types";

export function sector3ToolMetadata(
  config: Sector3ToolRuntimeConfig,
  description: string
): Metadata {
  const brand = getToolBrand(config.slug);
  return {
    title: `${config.displayName} — Northside Intelligence`,
    description,
    icons: {
      icon: [{ url: brand.logo, type: "image/svg+xml" }],
      apple: [{ url: brand.logo, type: "image/svg+xml" }],
    },
  };
}

export function Sector3ToolLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#07080C] text-white antialiased">
      {children}
    </div>
  );
}
