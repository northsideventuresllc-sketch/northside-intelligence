import { redirectLoggedInSector3ToDashboard } from "@/lib/sector3-auth-redirect";
import Link from "next/link";
import { GrantBotBackground } from "@/components/grantbot/GrantBotBackground";
import { GrantBotNav } from "@/components/grantbot/GrantBotNav";
import { GrantBotPricingSection } from "@/components/grantbot/GrantBotPricingSection";
import { grantbotPath, portalSignUpUrl } from "@/lib/grantbot/auth";
import { formatFreeTierHeroLabel } from "@/lib/billing/sector3-tool-pricing";

const categories = ["Nonprofit", "Creator", "Research", "Small Business", "Arts & Culture"];

export default async function GrantBotHome() {
  await redirectLoggedInSector3ToDashboard("/grantbot");

  const signupUrl = portalSignUpUrl();
  const freeTierLabel = formatFreeTierHeroLabel("grantbot");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GrantBotBackground />
      <GrantBotNav />

      <main className="relative z-10">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gb-emerald/30 bg-gb-emerald/10 px-4 py-1.5 text-sm text-gb-emerald">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-gb-emerald animate-wave"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            Powered by Claude · Part of Northside Intelligence
          </div>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            <span className="gb-gradient-text">Grant discovery</span>
            <br />
            <span className="text-white">and drafting that saves hours</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gb-muted">
            Describe your organization, find relevant funding opportunities, and draft compelling
            applications — one NI account unlocks everything.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={signupUrl}
              className="rounded-2xl bg-gradient-to-r from-gb-emerald via-gb-teal to-gb-amber px-8 py-3.5 text-lg font-semibold text-gb-bg shadow-gb-glow transition hover:scale-[1.02] hover:opacity-95"
            >
              Start Free — {freeTierLabel}
            </a>
            <Link
              href={grantbotPath("/dashboard")}
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-white/90 transition hover:border-gb-emerald/40 hover:bg-white/10"
            >
              Open Dashboard
            </Link>
          </div>

          <div className="gb-glass mt-16 w-full max-w-2xl rounded-3xl p-6 text-left shadow-gb-glow">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gb-muted">
              Live preview
            </p>
            <div className="mb-4 rounded-2xl border border-white/10 bg-gb-bg/60 p-4 text-sm text-gb-muted">
              &ldquo;Community arts nonprofit serving youth in Detroit — seeking program expansion
              funding.&rdquo;
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    c === "Nonprofit"
                      ? "border border-gb-emerald/50 bg-gb-emerald/20 text-gb-emerald"
                      : "border border-white/10 bg-white/5 text-gb-muted"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-gb-emerald/20 bg-gb-bg/60 p-4 text-sm text-white/90">
                <p className="font-semibold text-white">NEA Grants for Arts Projects</p>
                <p className="mt-1 text-gb-muted">National Endowment for the Arts · $10K–$100K</p>
                <p className="mt-3 text-white/85">
                  Strong fit for community-based arts education programs serving youth.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-gb-teal/40 bg-gb-teal/10 px-3 py-1.5 text-xs font-medium text-gb-teal">
                    Open on NEA
                  </span>
                  <span className="rounded-xl bg-gradient-to-r from-gb-emerald to-gb-amber px-3 py-1.5 text-xs font-semibold text-gb-bg">
                    Draft Application
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <GrantBotPricingSection />
      </main>
    </div>
  );
}
