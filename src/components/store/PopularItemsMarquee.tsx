"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import type { CatalogProductView, PopularPicksResponse } from "@/lib/store/catalog/types";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import { StoreProductImage } from "@/components/store/StoreProductImage";

function MarqueeCard({ product }: { product: CatalogProductView }) {
  const priceLabel = formatRetailPriceRange(
    product.retailPriceCents,
    product.retailPriceMinCents,
    product.retailPriceMaxCents,
    product.currency
  );

  return (
    <Link
      href={`/store/p/${product.slug}`}
      className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-cyan-400/30 hover:bg-white/[0.07]"
    >
      <div className="flex h-28 items-center justify-center border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent p-3">
        {product.imageUrl ? (
          <StoreProductImage
            src={product.imageUrl}
            alt={product.name}
            width={120}
            height={120}
            className="max-h-20 object-contain transition group-hover:scale-105"
          />
        ) : (
          <span className="text-xs text-ni-muted">No Image</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-xs font-semibold text-white">{product.name}</p>
        <p className="mt-auto pt-2 text-sm font-bold text-cyan-300">{priceLabel}</p>
      </div>
    </Link>
  );
}

export function PopularItemsMarquee() {
  const [data, setData] = useState<PopularPicksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const headingId = useId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store/popular");
      const json = (await res.json()) as PopularPicksResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mt-10 animate-pulse rounded-xl border border-white/5 bg-white/[0.02] py-8 text-center text-sm text-ni-muted">
        Loading popular picks…
      </div>
    );
  }

  if (!data?.picks.length) return null;

  const track = [...data.picks, ...data.picks];

  return (
    <section className="mt-10" aria-labelledby={headingId}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Popular Right Now
          </p>
          <h2 id={headingId} className="text-lg font-semibold text-white">
            Trending Picks
          </h2>
        </div>
        <p className="text-[10px] text-ni-muted">
          Refreshes{" "}
          {data.resetsAt
            ? new Date(data.resetsAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "daily"}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-ni-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-ni-bg to-transparent" />

        <div className="group/marquee flex w-max animate-marquee-scroll gap-4 px-4 hover:[animation-play-state:paused]">
          {track.map((product, index) => (
            <MarqueeCard key={`${product.slug}-${index}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
