import type { Metadata } from "next";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { ServicesPageClient } from "@/components/services/ServicesPageClient";

export const metadata: Metadata = {
  title: "Intelligence Services | Northside Intelligence",
  description:
    "Tailored intelligence solutions for individuals and businesses — custom server builds, workflow audits, AI strategy, and more from Northside Intelligence.",
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative px-6 pb-20 pt-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.04] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <ServicesPageClient />
        </div>
      </section>
      <Footer />
    </main>
  );
}
