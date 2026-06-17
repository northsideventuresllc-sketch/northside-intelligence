import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { ViralProductsCarousel } from "@/components/store/ViralProductsCarousel";
import { WebTrackingOptIn } from "@/components/store/WebTrackingOptIn";

export const metadata: Metadata = {
  title: "Store | Northside Intelligence",
  description:
    "Viral deals curated daily — smart prices on trending products with NI intelligence behind every pick.",
};

export const dynamic = "force-dynamic";

export default function StorePage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative px-6 pb-20 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.04] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
              NI Deals
            </p>
            <h1 className="text-3xl font-semibold text-white">NI Store</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
              Ten viral products refreshed every 24 hours — scored from what&apos;s trending online
              and what shoppers love on NI. Search and full checkout arrive in the next updates.
            </p>
          </div>

          <WebTrackingOptIn />
          <ViralProductsCarousel />

          <p className="mt-6 text-center text-xs text-ni-muted">
            Prices include our service fee. Supplier listing costs are never shown — you only see
            your NI price.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
