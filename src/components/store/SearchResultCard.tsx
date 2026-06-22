"use client";

import Link from "next/link";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import { StockImageDisclaimer } from "@/components/store/StockImageDisclaimer";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
interface SearchResultCardProps {
  product: CatalogProductView;
  onSelect?: () => void;
}

export function SearchResultCard({ product, onSelect }: SearchResultCardProps) {
  const priceLabel = formatRetailPriceRange(
    product.retailPriceCents,
    product.retailPriceMinCents,
    product.retailPriceMaxCents,
    product.currency
  );

  return (
    <Link
      href={`/store/p/${product.slug}`}
      onClick={onSelect}
      className="glass-panel group flex flex-col overflow-hidden transition hover:border-cyan-400/30"
    >
      <div className="relative flex h-40 items-center justify-center border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent">
        {product.imageUrl ? (
          <StoreProductImage
            src={product.imageUrl}
            alt={product.name}
            width={160}
            height={160}
            className="max-h-32 object-contain transition group-hover:scale-105"
          />
        ) : (
          <span className="text-sm text-ni-muted">No Image</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{product.name}</h3>
        <p className="mt-2 text-lg font-bold text-white">{priceLabel}</p>
        {product.imageIsStockPhoto && <StockImageDisclaimer className="mt-3" />}
        <p className="mt-2 text-[11px] text-ni-muted">
          Ships in ~{product.estimatedDeliveryDays} days
        </p>
      </div>
    </Link>
  );
}
