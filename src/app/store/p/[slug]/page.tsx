import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { getCatalogProductBySlug, toCatalogProductView } from "@/lib/store/catalog/products";
import { formatStorePrice } from "@/lib/store/client";

export const dynamic = "force-dynamic";

const PLATFORM_LABELS: Record<string, string> = {
  cj: "CJ Dropshipping",
  aliexpress: "AliExpress",
  temu: "Temu",
  amazon: "Amazon",
  curated: "NI Deals",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getCatalogProductBySlug(params.slug);
  if (!product) return { title: "Product | NI Store" };
  return {
    title: `${product.name} | NI Store`,
    description: product.description,
  };
}

export default async function CatalogProductPage({ params }: { params: { slug: string } }) {
  const row = await getCatalogProductBySlug(params.slug);
  if (!row) notFound();

  const product = toCatalogProductView(row);

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-3xl">
          <Link href="/store" className="text-sm text-cyan-300 hover:underline">
            ← Back to Store
          </Link>
          <div className="glass-panel mt-6 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="flex h-72 items-center justify-center border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent p-8 md:h-auto md:w-2/5 md:border-b-0 md:border-r">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={280}
                    height={280}
                    className="max-h-60 object-contain"
                  />
                ) : (
                  <span className="text-ni-muted">No Image</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-ni-cyan/60">
                  {product.category.replace(/-/g, " ")}
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-white">{product.name}</h1>
                <p className="mt-4 text-3xl font-bold text-white">
                  {formatStorePrice(product.retailPriceCents, product.currency)}
                </p>
                {product.reviewRating != null && (
                  <p className="mt-2 text-sm text-ni-muted">
                    ★ {product.reviewRating.toFixed(1)} · {product.reviewCount.toLocaleString()}{" "}
                    reviews
                  </p>
                )}
                <p className="mt-4 text-sm leading-relaxed text-ni-muted">{product.description}</p>
                <dl className="mt-6 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ni-muted">Fulfilled via</dt>
                    <dd className="text-white">
                      {PLATFORM_LABELS[product.sourcePlatform] ?? product.sourcePlatform}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ni-muted">Estimated arrival</dt>
                    <dd className="text-white">~{product.estimatedDeliveryDays} business days</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  disabled
                  className="mt-8 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-medium text-cyan-300 opacity-60"
                >
                  Cart & Checkout — Coming in Next Update
                </button>
                <p className="mt-3 text-center text-xs text-ni-muted">
                  Full cart, search, and checkout ship in upcoming releases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
