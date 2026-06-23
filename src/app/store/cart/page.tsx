import { Suspense } from "react";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { StoreCartPageClient } from "@/app/store/cart/StoreCartPageClient";

export default function StoreCartPage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <Suspense
        fallback={<div className="px-6 pt-24 text-center text-ni-muted">Loading cart…</div>}
      >
        <StoreCartPageClient />
      </Suspense>
      <Footer />
    </main>
  );
}
