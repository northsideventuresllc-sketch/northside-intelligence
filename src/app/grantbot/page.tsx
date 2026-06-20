import { redirectLoggedInSector3ToDashboard } from "@/lib/sector3-auth-redirect";
import Image from "next/image";
import Link from "next/link";
import { grantbotPath, portalSignUpUrl } from "@/lib/grantbot/auth";

export default async function GrantBotHome() {
  await redirectLoggedInSector3ToDashboard("/grantbot");

  const signupUrl = portalSignUpUrl();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.12)_0%,transparent_55%)]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Image src="/logos/grantbot.svg" alt="GrantBot" width={36} height={36} />
          <span className="text-lg font-semibold text-white">GrantBot</span>
        </div>
        <Link
          href={grantbotPath("/dashboard")}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
        >
          Open Dashboard
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-300">
          Powered by Claude · Part of Northside Intelligence
        </div>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-400 bg-clip-text text-transparent">
            Grant discovery
          </span>
          <br />
          <span className="text-white">and drafting that saves hours</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ni-muted">
          GrantBot helps nonprofits and creators find relevant funding opportunities and draft
          compelling applications — one NI account unlocks everything.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href={signupUrl}
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-amber-400 px-8 py-3.5 text-lg font-semibold text-ni-bg shadow-[0_0_40px_rgba(52,211,153,0.25)] transition hover:scale-[1.02] hover:opacity-95"
          >
            Get Started
          </a>
          <Link
            href={grantbotPath("/dashboard")}
            className="rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-white/90 transition hover:border-emerald-400/40 hover:bg-white/10"
          >
            Open Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
