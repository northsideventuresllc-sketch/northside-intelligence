import Link from "next/link";
import { redirectLoggedInSector3ToDashboard } from "@/lib/sector3-auth-redirect";
import { Sector3ToolBackground } from "@/components/sector3/Sector3ToolBackground";
import { Sector3ToolNav } from "@/components/sector3/Sector3ToolNav";
import { Sector3ToolPricingSection } from "@/components/sector3/Sector3ToolPricingSection";
import { formatFreeTierHeroLabel } from "@/lib/billing/sector3-tool-pricing";
import { getToolBrand } from "@/lib/constants";
import { createSector3ToolAuth } from "@/lib/sector3-tools/auth";
import type { Sector3ToolRuntimeConfig } from "@/lib/sector3-tools/types";

interface LandingContent {
  headline: string;
  headlineAccent: string;
  subhead: string;
  previewLabel: string;
  previewInput: string;
  previewOutput: string;
  tags: string[];
}

export function createSector3LandingPage(
  config: Sector3ToolRuntimeConfig,
  content: LandingContent
) {
  return async function Sector3LandingPage() {
    await redirectLoggedInSector3ToDashboard(config.basePath);
    const auth = createSector3ToolAuth(config);
    const brand = getToolBrand(config.slug);
    const freeTierLabel = formatFreeTierHeroLabel(config.slug);

    return (
      <div className="relative min-h-screen overflow-hidden text-white">
        <Sector3ToolBackground slug={config.slug} />
        <Sector3ToolNav config={config} />

        <main className="relative z-10">
          <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm"
              style={{
                borderColor: `${brand.brandColor}44`,
                backgroundColor: `${brand.brandColor}14`,
                color: brand.brandColor,
              }}
            >
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1.5 w-1.5 rounded-full animate-wave"
                    style={{
                      backgroundColor: brand.brandColor,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </span>
              Powered by Claude · Part of Northside Intelligence
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              <span
                className={`bg-gradient-to-r ${brand.brandGradient} bg-clip-text text-transparent`}
              >
                {content.headline}
              </span>
              <br />
              <span className="text-white">{content.headlineAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/60">{content.subhead}</p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href={auth.portalSignUpUrl()}
                className="rounded-2xl px-8 py-3.5 text-lg font-semibold text-[#07080C] shadow-lg transition hover:scale-[1.02]"
                style={{ backgroundColor: brand.brandColor }}
              >
                Start Free — {freeTierLabel}
              </a>
              <Link
                href={auth.path("/dashboard")}
                className="rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-white/90 transition hover:bg-white/10"
              >
                Open Dashboard
              </Link>
            </div>

            <div
              className="mt-16 w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl"
              style={{ boxShadow: `0 0 40px ${brand.brandColor}22` }}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/50">
                {content.previewLabel}
              </p>
              <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                {content.previewInput}
              </div>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-white/80">{content.previewOutput}</p>
            </div>
          </section>

          <Sector3ToolPricingSection config={config} />
        </main>
      </div>
    );
  };
}
