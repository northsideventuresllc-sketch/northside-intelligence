import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { StoreCartProvider } from "@/components/store/StoreCartProvider";
import { StorePageClient } from "@/components/store/StorePageClient";

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
      <StoreCartProvider>
        <section className="relative px-6 pb-20 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.04] via-transparent to-transparent" />
          <div className="relative mx-auto max-w-6xl">
            <Suspense
              fallback={
                <div className="glass-panel animate-pulse p-12 text-center text-ni-muted">
                  Loading store…
                </div>
              }
            >
              <StorePageClient />
            </Suspense>
          </div>
        </section>
      </StoreCartProvider>
      <Footer />
    </main>
  );
}
