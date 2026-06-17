import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { ProductPurchasePanel } from "@/components/store/ProductPurchasePanel";
import { StoreCartProvider } from "@/components/store/StoreCartProvider";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import { getCatalogProductBySlug, toCatalogProductView } from "@/lib/store/catalog/products";
import { ensureStoreEnv } from "@/lib/store/env";
import { getStoreGateStatus } from "@/lib/store/gate";
import { formatStorePrice } from "@/lib/store/client";
import { STORE_PLATFORM_LABELS } from "@/lib/store/platform-labels";

export const dynamic = "force-dynamic";

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
  await ensureStoreEnv();
  const row = await getCatalogProductBySlug(params.slug);
  if (!row) notFound();

  const product = toCatalogProductView(row);
  const gate = getStoreGateStatus();

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <StoreCartProvider>
        <section className="relative px-6 pb-20 pt-24">
          <div className="mx-auto max-w-4xl">
            <Link href="/store" className="text-sm text-cyan-300 hover:underline">
              ← Back to Store
            </Link>
            <div className="glass-panel mt-6 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex h-80 items-center justify-center border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent p-8 lg:h-auto lg:w-2/5 lg:border-b-0 lg:border-r">
                  {product.imageUrl ? (
                    <StoreProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      width={320}
                      height={320}
                      className="max-h-64 object-contain"
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
                  {product.reviewRating != null && product.reviewCount > 0 ? (
                    <p className="mt-2 text-sm text-ni-muted">
                      ★ {product.reviewRating.toFixed(1)} · {product.reviewCount.toLocaleString()}{" "}
                      reviews
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-ni-muted">New listing — reviews coming soon</p>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-ni-muted">{product.description}</p>
                  <dl className="mt-6 space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ni-muted">Fulfilled via</dt>
                      <dd className="text-white">
                        {STORE_PLATFORM_LABELS[product.sourcePlatform] ?? product.sourcePlatform}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ni-muted">Standard ETA</dt>
                      <dd className="text-white">~{product.estimatedDeliveryDays} business days</dd>
                    </div>
                  </dl>

                  <ProductPurchasePanel
                    product={product}
                    sourceProductId={row.sourceProductId}
                    checkoutLive={gate.live}
                  />
                </div>
              </div>
            </div>

            {product.reviewCount > 0 && (
              <section className="glass-panel mt-6 p-6">
                <h2 className="text-lg font-semibold text-white">Customer Reviews</h2>
                <p className="mt-2 text-sm text-ni-muted">
                  Aggregated rating from supplier and trend signals. NI displays verified retail
                  pricing only — never supplier listing costs.
                </p>
                <p className="mt-4 text-2xl font-bold text-white">
                  ★ {product.reviewRating?.toFixed(1)}
                  <span className="ml-2 text-sm font-normal text-ni-muted">
                    ({product.reviewCount.toLocaleString()} reviews)
                  </span>
                </p>
              </section>
            )}
          </div>
        </section>
      </StoreCartProvider>
      <Footer />
    </main>
  );
}
