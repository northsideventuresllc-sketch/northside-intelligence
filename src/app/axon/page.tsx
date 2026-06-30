import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const metadata: Metadata = {
  title: "AXON | NORTHSiDE Intelligence",
  description: "AXON autonomous command surface — master account access only.",
  robots: { index: false, follow: false },
};

export default async function AxonPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?returnTo=/axon");
  }

  const billingState = await getUserBillingState(user.id);

  if (!billingState.isMasterAccount) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <section className="relative px-6 pb-20 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.06] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Sector 5 · Master Access
          </p>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">AXON</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ni-muted md:text-base">
            NVG&apos;s autonomous profit engine. Phase 1 runs on Telegram approval and GitHub
            Actions — this portal route is your signed-in master preview until AXON becomes the full
            command surface.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ni-cyan">
                Approve outreach
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ni-muted">
                Drafts land in Telegram{" "}
                <span className="text-white">@northsideaxonbot</span>. Commands:{" "}
                <code className="text-cyan-300">/status</code>,{" "}
                <code className="text-cyan-300">/approve</code>,{" "}
                <code className="text-cyan-300">/reject</code>.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ni-cyan">
                Engine repo
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ni-muted">
                Outreach loop runs from the AXON GitHub repo on a nightly schedule after Hermes
                sync.
              </p>
              <a
                href="https://github.com/northsideventuresllc-sketch/AXON"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                Open AXON on GitHub →
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
            >
              ← Back to home
            </Link>
            <Link
              href="/admin"
              className="inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-ni-muted transition hover:border-white/20 hover:text-white"
            >
              Admin dashboard
            </Link>
            <Link
              href="/services"
              className="inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-ni-muted transition hover:border-white/20 hover:text-white"
            >
              NI services
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
