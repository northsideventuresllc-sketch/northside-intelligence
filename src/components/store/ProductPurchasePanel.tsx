"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockImageDisclaimer } from "@/components/store/StockImageDisclaimer";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import { expeditedDeliveryDays } from "@/lib/store/cart/types";
import type { CartLineItem } from "@/lib/store/cart/types";
import { useStoreCart } from "@/components/store/StoreCartProvider";
import { useStoreCheckout } from "@/hooks/useStoreCheckout";
import type { ShippingTier } from "@/lib/store/cart/types";
import type { StoreGateStatus } from "@/lib/store/types";

interface ProductPurchasePanelProps {
  product: CatalogProductView;
  sourceProductId: string | null;
  checkoutLive: boolean;
}

export function ProductPurchasePanel({
  product,
  sourceProductId,
  checkoutLive,
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const { addItem, items } = useStoreCart();
  const { checkout, loading: checkoutLoading, error: checkoutError, setError } = useStoreCheckout();
  const [shippingTier, setShippingTier] = useState<ShippingTier>("standard");
  const [added, setAdded] = useState(false);
  const [gate, setGate] = useState<StoreGateStatus | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id ?? null
  );

  useEffect(() => {
    fetch("/api/store/gate")
      .then((r) => r.json())
      .then((json: StoreGateStatus) => setGate(json))
      .catch(() => setGate(null));
  }, []);

  const checkoutEnabled = gate?.live ?? checkoutLive;

  const standardDays = product.estimatedDeliveryDays;
  const expressDays = expeditedDeliveryDays(standardDays);

  const selectedVariant = useMemo(
    () => product.variants?.find((v) => v.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const displayRetailCents = selectedVariant?.retailPriceCents ?? product.retailPriceCents;

  function buildLineItem(): CartLineItem {
    return {
      slug: product.slug,
      name: product.name,
      imageUrl: selectedVariant?.imageUrl ?? product.imageUrl,
      retailPriceCents: displayRetailCents,
      currency: product.currency,
      sourcePlatform: product.sourcePlatform,
      sourceProductId: sourceProductId ?? null,
      variantId: selectedVariant?.id ?? null,
      quantity: 1,
      shippingTier,
    };
  }

  function handleAddToCart() {
    addItem(buildLineItem());
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  function handleViewCart() {
    addItem(buildLineItem());
    router.push("/store/cart");
  }

  async function handleCheckoutNow() {
    setError("");
    const line = buildLineItem();
    const variantKey = line.variantId ?? "";
    const matchIndex = items.findIndex(
      (item) => item.slug === line.slug && (item.variantId ?? "") === variantKey
    );

    let checkoutLines: CartLineItem[];
    if (matchIndex >= 0) {
      checkoutLines = items.map((item, index) =>
        index === matchIndex
          ? {
              ...item,
              quantity: Math.min(10, item.quantity + 1),
              shippingTier: line.shippingTier,
              retailPriceCents: line.retailPriceCents,
            }
          : item
      );
    } else {
      checkoutLines = [...items, line];
    }

    addItem(line);
    await checkout(checkoutLines);
  }

  return (
    <div className="mt-8 space-y-4">
      {product.variants && product.variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-white">Options</p>
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
            {product.variants.map((variant) => (
              <li key={variant.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="product-variant"
                      checked={selectedVariantId === variant.id}
                      onChange={() => setSelectedVariantId(variant.id)}
                    />
                    <span className="text-white">{variant.name}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-cyan-200">
                    {formatRetailPriceRange(variant.retailPriceCents, null, null, product.currency)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.imageIsStockPhoto && <StockImageDisclaimer />}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-white">Shipping Speed</legend>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <input
              type="radio"
              name="shipping-tier"
              checked={shippingTier === "standard"}
              onChange={() => setShippingTier("standard")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-white">Standard</span>
              <span className="text-xs text-ni-muted">~{standardDays} business days</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <input
              type="radio"
              name="shipping-tier"
              checked={shippingTier === "expedited"}
              onChange={() => setShippingTier("expedited")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-white">Expedited</span>
              <span className="text-xs text-ni-muted">
                ~{expressDays} business days · premium at checkout
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
        >
          {added ? "Added to Cart" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleViewCart}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
        >
          View Cart
        </button>
      </div>

      <button
        type="button"
        onClick={handleCheckoutNow}
        disabled={!checkoutEnabled || checkoutLoading}
        className="w-full rounded-xl bg-ni-cyan py-3 text-sm font-semibold uppercase tracking-wider text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {checkoutLoading ? "Redirecting…" : "Checkout Now"}
      </button>

      {!checkoutEnabled && (
        <p className="text-center text-xs text-amber-200/90">
          Checkout is temporarily unavailable. You can still add items to your cart.
        </p>
      )}

      {checkoutError && <p className="text-center text-sm text-red-300">{checkoutError}</p>}

      <p className="text-center text-[11px] text-ni-muted">
        Prices are verified against CJ at checkout. NI retail = CJ listing price + 10%.
      </p>
    </div>
  );
}
