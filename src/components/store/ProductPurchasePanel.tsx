"use client";

import { useMemo, useState } from "react";
import { StockImageDisclaimer } from "@/components/store/StockImageDisclaimer";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import { expeditedDeliveryDays } from "@/lib/store/cart/types";
import { useStoreCart } from "@/components/store/StoreCartProvider";
import type { ShippingTier } from "@/lib/store/cart/types";

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
  const { addItem } = useStoreCart();
  const [shippingTier, setShippingTier] = useState<ShippingTier>("standard");
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id ?? null
  );

  const standardDays = product.estimatedDeliveryDays;
  const expressDays = expeditedDeliveryDays(standardDays);

  const selectedVariant = useMemo(
    () => product.variants?.find((v) => v.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const displayRetailCents = selectedVariant?.retailPriceCents ?? product.retailPriceCents;
  const priceLabel = formatRetailPriceRange(
    displayRetailCents,
    selectedVariant ? selectedVariant.retailPriceCents : product.retailPriceMinCents,
    selectedVariant ? selectedVariant.retailPriceCents : product.retailPriceMaxCents,
    product.currency
  );

  function handleAddToCart() {
    addItem({
      slug: product.slug,
      name: product.name,
      imageUrl: selectedVariant?.imageUrl ?? product.imageUrl,
      retailPriceCents: displayRetailCents,
      currency: product.currency,
      sourcePlatform: product.sourcePlatform,
      sourceProductId,
      variantId: selectedVariant?.id ?? null,
      quantity: 1,
      shippingTier,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-8 space-y-4">
      {product.variants && product.variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-white">CJ Variations</p>
          <p className="mb-3 text-xs text-ni-muted">
            NI price = CJ variation listing price + 10% for each option below.
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
            {product.variants.map((variant) => (
              <li key={variant.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cj-variant"
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

      <p className="text-sm text-ni-muted">
        Selected NI price: <span className="font-semibold text-white">{priceLabel}</span>
      </p>

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
              <span className="text-xs text-ni-muted">~{expressDays} business days · premium at checkout</span>
            </span>
          </label>
        </div>
      </fieldset>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!checkoutLive}
        className="w-full rounded-xl bg-ni-cyan py-3 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {added ? "Added to Cart" : "Add to Cart"}
      </button>

      <p className="text-center text-[11px] text-ni-muted">
        Prices are verified against CJ at checkout. NI retail = CJ listing price + 10%.
      </p>
    </div>
  );
}
