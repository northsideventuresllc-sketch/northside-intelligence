import { Suspense } from "react";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { StoreTrackPageClient } from "@/app/store/track/StoreTrackPageClient";

export default function StoreTrackPage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <Suspense
        fallback={<div className="px-6 pt-24 text-center text-ni-muted">Loading order…</div>}
      >
        <StoreTrackPageClient />
      </Suspense>
      <Footer />
    </main>
  );
}
