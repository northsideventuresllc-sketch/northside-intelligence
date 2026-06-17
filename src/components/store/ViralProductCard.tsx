"use client";

import Image from "next/image";
import Link from "next/link";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { formatStorePrice } from "@/lib/store/client";
import { STORE_PLATFORM_LABELS } from "@/lib/store/platform-labels";

interface ViralProductCardProps {
  product: CatalogProductView;
  variant: "center" | "side";
  onSelect?: () => void;
}

export function ViralProductCard({ product, variant, onSelect }: ViralProductCardProps) {
  const isCenter = variant === "center";

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
          <Image
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
        {isCenter && (
          <p className="mt-2 line-clamp-2 text-sm text-ni-muted">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className={`font-bold text-white ${isCenter ? "text-2xl" : "text-base"}`}>
            {formatStorePrice(product.retailPriceCents, product.currency)}
          </p>
          {isCenter && product.reviewRating != null && (
            <p className="text-xs text-ni-muted">
              ★ {product.reviewRating.toFixed(1)} ({product.reviewCount.toLocaleString()})
            </p>
          )}
        </div>
        {isCenter && (
          <p className="mt-2 text-[11px] text-ni-muted">
            Ships in ~{product.estimatedDeliveryDays} days · via{" "}
            {STORE_PLATFORM_LABELS[product.sourcePlatform] ?? product.sourcePlatform}
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
