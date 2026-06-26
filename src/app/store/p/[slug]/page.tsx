import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { NavServer } from "@/components/landing/NavServer";
import { PriceChangeNotices } from "@/components/store/PriceChangeNotices";
import { ProductPurchasePanel } from "@/components/store/ProductPurchasePanel";
import { StoreProductDescription } from "@/components/store/StoreProductDescription";
import { StoreCartHeader } from "@/components/store/StoreCartHeader";
import { StockImageDisclaimer } from "@/components/store/StockImageDisclaimer";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import { refreshCatalogFromCj } from "@/lib/store/catalog/live-cj";
import { getCatalogProductBySlug, toCatalogProductView } from "@/lib/store/catalog/products";
import { ensureStoreEnv } from "@/lib/store/env";
import { SMART_STORE_NAME, smartStorePageTitle } from "@/lib/store/branding";
import { STORE_PLATFORM_LABELS } from "@/lib/store/platform-labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getCatalogProductBySlug(params.slug);
  if (!product) return { title: smartStorePageTitle("Product") };
  return {
    title: smartStorePageTitle(product.name),
    description: `Shop ${product.name} on ${SMART_STORE_NAME}.`,
  };
}

export default async function CatalogProductPage({ params }: { params: { slug: string } }) {
  await ensureStoreEnv();
  const row = await getCatalogProductBySlug(params.slug);
  if (!row) notFound();

  const refreshed = await refreshCatalogFromCj(row);
  const catalogRow = refreshed.row ?? row;
  if (!catalogRow) notFound();

  const product = toCatalogProductView(catalogRow, {
    priceChangeNotice: refreshed.notice ?? undefined,
  });
  const priceLabel = formatRetailPriceRange(
    product.retailPriceCents,
    product.retailPriceMinCents,
    product.retailPriceMaxCents,
    product.currency
  );

  return (
    <main className="min-h-screen bg-ni-bg">
      <NavServer />
      <section className="relative px-6 pb-36 pt-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href="/store" className="shrink-0 text-sm text-cyan-300 hover:underline">
              ← Back to {SMART_STORE_NAME}
            </Link>
            <StoreCartHeader />
          </div>
          <div className="glass-panel overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex h-80 shrink-0 items-center justify-center border-b border-white/10 bg-gradient-to-br from-cyan-500/10 to-transparent p-8 lg:h-auto lg:min-h-[28rem] lg:w-2/5 lg:border-b-0 lg:border-r">
                  {product.imageUrl ? (
                    <StoreProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      width={320}
                      height={320}
                      className="max-h-64 object-contain"
                    />
                  ) : (
                    <span className="sr-only">No product image</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ni-cyan/60">
                    {product.category.replace(/-/g, " ")}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">{product.name}</h1>
                  <StoreProductDescription
                    description={product.description}
                    productName={product.name}
                    className="mt-4"
                  />
                  <p className="mt-4 text-3xl font-bold text-white">{priceLabel}</p>
                  {product.priceChangeNotice && (
                    <PriceChangeNotices
                      notices={[product.priceChangeNotice]}
                      className="mt-4"
                    />
                  )}
                  {refreshed.refreshFailed && (
                    <p
                      className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100/90"
                      role="status"
                    >
                      Live supplier pricing is temporarily unavailable. Showing the last saved
                      listing — your total is verified again at checkout.
                    </p>
                  )}
                  {product.imageIsStockPhoto && <StockImageDisclaimer className="mt-4" />}
                  {product.reviewRating != null && product.reviewCount > 0 ? (
                    <p className="mt-2 text-sm text-ni-muted">
                      ★ {product.reviewRating.toFixed(1)} · {product.reviewCount.toLocaleString()}{" "}
                      reviews
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-ni-muted">New listing — reviews coming soon</p>
                  )}
                  <dl className="mt-6 space-y-2 border-t border-white/10 pt-6 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ni-muted">Fulfillment</dt>
                      <dd className="text-white">
                        Fulfilled by{" "}
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
                    sourceProductId={catalogRow.sourceProductId}
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
      <Footer />
    </main>
  );
}
