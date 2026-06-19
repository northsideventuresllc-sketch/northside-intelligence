"use client";

import Image from "next/image";
import { useState } from "react";
import { canCheckoutProduct, formatStorePrice, type StoreProductView } from "@/lib/store/client";
import type { StoreGateStatus } from "@/lib/store/types";

interface StoreCatalogProps {
  products: StoreProductView[];
  gate: StoreGateStatus;
}

export function StoreCatalog({ products, gate }: StoreCatalogProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} checkoutLive={gate.live} gate={gate} />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  checkoutLive,
  gate,
}: {
  product: StoreProductView;
  checkoutLive: boolean;
  gate: StoreGateStatus;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const checkoutAllowed = checkoutLive && canCheckoutProduct({ isMock: product.isMock }, gate);

  async function handleCheckout() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug: product.slug, quantity: 1 }),
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout unavailable");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="glass-panel flex flex-col overflow-hidden">
      <div className="flex h-44 items-center justify-center border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={120}
            height={120}
            className="max-h-28 w-auto object-contain"
          />
        ) : (
          <div className="text-sm text-ni-muted">No Image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-white">{product.name}</h2>
          {product.isMock && (
            <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              Preview
            </span>
          )}
        </div>
        <p className="mt-2 flex-1 text-sm text-ni-muted">{product.description}</p>
        <p className="mt-4 text-xl font-bold text-white">
          {formatStorePrice(product.priceCents, product.currency)}
        </p>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={!checkoutAllowed || loading}
          className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Loading…" : checkoutAllowed ? "Buy Now" : "Coming Soon"}
        </button>
        {error && (
          <p className="mt-2 text-xs text-red-300" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
