import type { Metadata } from "next";
import { ComingSoonBanner } from "@/components/store/ComingSoonBanner";
import { StoreCatalog } from "@/components/store/StoreCatalog";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { getStoreGateStatus } from "@/lib/store/gate";
import { listActiveStoreProducts } from "@/lib/store/products";
import type { StoreProductView } from "@/lib/store/types";

function toView(product: Awaited<ReturnType<typeof listActiveStoreProducts>>[number]): StoreProductView {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    currency: product.currency,
    imageUrl: product.imageUrl,
    isMock: product.isMock,
  };
}

export const metadata: Metadata = {
  title: "Store | Northside Intelligence",
  description: "Official Northside Intelligence merchandise.",
};

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const products = (await listActiveStoreProducts()).map(toView);
  const gate = getStoreGateStatus();

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
              Merch
            </p>
            <h1 className="text-3xl font-semibold text-white">NI Store</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
              Official Northside Intelligence gear — fulfilled via CJDropshipping when live.
            </p>
          </div>

          <ComingSoonBanner gate={gate} />

          {products.length === 0 ? (
            <div className="glass-panel p-8 text-center text-ni-muted">
              No products yet. Run the NI Store migration to seed the catalog.
            </div>
          ) : (
            <StoreCatalog products={products} gate={gate} />
          )}

          {!gate.live && (
            <p className="mt-8 text-center text-xs text-ni-muted">
              Mock listings are for preview only and cannot complete Stripe checkout.
            </p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
