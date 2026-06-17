"use client";

import { useState } from "react";
import type { CatalogProductView } from "@/lib/store/catalog/types";
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

  const standardDays = product.estimatedDeliveryDays;
  const expressDays = expeditedDeliveryDays(standardDays);

  function handleAddToCart() {
    addItem({
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      retailPriceCents: product.retailPriceCents,
      currency: product.currency,
      sourcePlatform: product.sourcePlatform,
      sourceProductId,
      quantity: 1,
      shippingTier,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-8 space-y-4">
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
        Estimated shipping & handling is collected at checkout. Unused shipping is refunded after
        fulfillment.
      </p>
    </div>
  );
}
