"use client";

import Link from "next/link";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import { StoreProductImage } from "@/components/store/StoreProductImage";

interface AssistantProductCardProps {
  product: CatalogProductView;
}

export function AssistantProductCard({ product }: AssistantProductCardProps) {
  const priceLabel = formatRetailPriceRange(
    product.retailPriceCents,
    product.retailPriceMinCents,
    product.retailPriceMaxCents,
    product.currency
  );

  return (
    <Link
      href={`/store/p/${product.slug}`}
      className="flex gap-3 rounded-xl border border-white/10 bg-ni-navy/60 p-2 transition hover:border-cyan-400/30 hover:bg-ni-navy/80"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cyan-500/10">
        {product.imageUrl ? (
          <StoreProductImage
            src={product.imageUrl}
            alt={product.name}
            width={56}
            height={56}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-[10px] text-ni-muted">No Image</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-medium text-white">{product.name}</p>
        <p className="mt-1 text-sm font-semibold text-cyan-300">{priceLabel}</p>
        <p className="mt-0.5 text-[10px] text-ni-muted">View Product</p>
      </div>
    </Link>
  );
}
