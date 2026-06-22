"use client";

import Link from "next/link";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import { StockImageDisclaimer } from "@/components/store/StockImageDisclaimer";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
interface ViralProductCardProps {
  product: CatalogProductView;
  variant: "center" | "side";
  onSelect?: () => void;
}

export function ViralProductCard({ product, variant, onSelect }: ViralProductCardProps) {
  const isCenter = variant === "center";
  const priceLabel = formatRetailPriceRange(
    product.retailPriceCents,
    product.retailPriceMinCents,
    product.retailPriceMaxCents,
    product.currency
  );

  const content = (
    <article
      className={`glass-panel flex flex-col overflow-hidden transition ${
        isCenter ? "shadow-[0_0_40px_rgba(0,212,255,0.12)]" : ""
      }`}
    >
      <div
        className={`relative flex items-center justify-center border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent ${
          isCenter ? "h-52" : "h-36"
        }`}
      >
        {product.imageUrl ? (
          <StoreProductImage
            src={product.imageUrl}
            alt={product.name}
            width={isCenter ? 200 : 120}
            height={isCenter ? 200 : 120}
            className={`object-contain ${isCenter ? "max-h-44" : "max-h-28"}`}
          />
        ) : (
          <span className="text-sm text-ni-muted">No Image</span>
        )}
        {product.viralRank != null && product.viralRank <= 3 && (
          <span className="absolute left-3 top-3 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
            #{product.viralRank} Viral
          </span>
        )}
        {product.personalized && isCenter && (
          <span className="absolute right-3 top-3 rounded-full border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
            For You
          </span>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${isCenter ? "p-5" : "p-3"}`}>
        <h3 className={`font-semibold text-white ${isCenter ? "text-lg" : "text-sm"}`}>
          {product.name}
        </h3>
        {product.imageIsStockPhoto && isCenter && (
          <StockImageDisclaimer className="mt-3" />
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className={`font-bold text-white ${isCenter ? "text-2xl" : "text-base"}`}>
            {priceLabel}
          </p>
          {isCenter && product.reviewRating != null && (
            <p className="text-xs text-ni-muted">
              ★ {product.reviewRating.toFixed(1)} ({product.reviewCount.toLocaleString()})
            </p>
          )}
        </div>
        {isCenter && (
          <p className="mt-2 text-[11px] text-ni-muted">
            Ships in ~{product.estimatedDeliveryDays} days
          </p>
        )}
      </div>
    </article>
  );

  if (!isCenter) return content;

  return (
    <Link href={`/store/p/${product.slug}`} onClick={onSelect} className="block">
      {content}
    </Link>
  );
}
