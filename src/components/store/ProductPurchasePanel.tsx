"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockImageDisclaimer } from "@/components/store/StockImageDisclaimer";
import { VariantTooltip } from "@/components/store/VariantTooltip";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import { expeditedDeliveryDays } from "@/lib/store/cart/types";
import type { CartLineItem } from "@/lib/store/cart/types";
import { useStoreCart } from "@/components/store/StoreCartProvider";
import { useStoreGate } from "@/components/store/StoreGateProvider";
import { useStoreCheckout } from "@/hooks/useStoreCheckout";
import type { ShippingTier } from "@/lib/store/cart/types";

function recordProductView(product: CatalogProductView) {
  void fetch("/api/store/user-features", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "history",
      catalogId: product.id,
      productSlug: product.slug,
      productName: product.name,
      imageUrl: product.imageUrl,
      retailPriceCents: product.retailPriceCents,
    }),
  }).catch(() => {});
}

interface ProductPurchasePanelProps {
  product: CatalogProductView;
  sourceProductId: string | null;
}

export function ProductPurchasePanel({
  product,
  sourceProductId,
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const gate = useStoreGate();
  const { addItem, items } = useStoreCart();
  const { checkout, loading: checkoutLoading, error: checkoutError, setError } = useStoreCheckout();
  const [shippingTier, setShippingTier] = useState<ShippingTier>("standard");
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [watching, setWatching] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id ?? null
  );

  useEffect(() => {
    recordProductView(product);
  }, [product]);

  const checkoutEnabled = gate.live;

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

  async function handleWishlist() {
    const res = await fetch("/api/store/user-features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "wishlist",
        catalogId: product.id,
        productSlug: product.slug,
        productName: product.name,
        imageUrl: selectedVariant?.imageUrl ?? product.imageUrl,
        retailPriceCents: displayRetailCents,
        variantId: selectedVariant?.id ?? null,
      }),
    });
    if (res.status === 401) {
      setActionMsg("Sign in to save to wishlist.");
      return;
    }
    setWishlisted(true);
    setActionMsg("Saved to wishlist.");
    window.setTimeout(() => setActionMsg(""), 2500);
  }

  async function handlePriceWatch() {
    const res = await fetch("/api/store/user-features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "price-watch",
        catalogId: product.id,
        productSlug: product.slug,
        productName: product.name,
        retailPriceCents: displayRetailCents,
        variantId: selectedVariant?.id ?? null,
      }),
    });
    if (res.status === 401) {
      setActionMsg("Sign in to track prices.");
      return;
    }
    setWatching(true);
    setActionMsg("Price watch added. You'll get portal and email alerts.");
    window.setTimeout(() => setActionMsg(""), 3000);
  }

  return (
    <div className="relative z-0 mt-8 space-y-5">
      {product.variants && product.variants.length > 1 && (
        <div className="relative z-10">
          <p className="mb-2 text-sm font-semibold text-white">Options</p>
          <ul
            className={`space-y-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 ${
              product.variants.length > 6 ? "max-h-64 overflow-y-auto pr-1" : ""
            }`}
          >
            {product.variants.map((variant) => (
              <li key={variant.id}>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 text-sm transition hover:border-white/10 hover:bg-white/[0.04] has-[:checked]:border-cyan-500/25 has-[:checked]:bg-cyan-500/[0.08]">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      type="radio"
                      name="product-variant"
                      checked={selectedVariantId === variant.id}
                      onChange={() => setSelectedVariantId(variant.id)}
                      className="shrink-0 accent-cyan-400"
                    />
                    <span className="min-w-0 flex-1 text-white">{variant.name}</span>
                    <VariantTooltip
                      variant={variant}
                      productDescription={product.description}
                      productName={product.name}
                    />
                  </span>
                  <span className="shrink-0 pl-2 font-semibold text-cyan-200">
                    {formatRetailPriceRange(variant.retailPriceCents, null, null, product.currency)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {product.imageIsStockPhoto && <StockImageDisclaimer />}

      <fieldset className="relative z-0 min-w-0">
        <legend className="mb-2 text-sm font-semibold text-white">Shipping Speed</legend>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/15 has-[:checked]:border-cyan-500/30 has-[:checked]:bg-cyan-500/[0.06]">
            <input
              type="radio"
              name="shipping-tier"
              checked={shippingTier === "standard"}
              onChange={() => setShippingTier("standard")}
              className="mt-1 shrink-0 accent-cyan-400"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">Standard</span>
              <span className="text-xs text-ni-muted">~{standardDays} business days</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/15 has-[:checked]:border-cyan-500/30 has-[:checked]:bg-cyan-500/[0.06]">
            <input
              type="radio"
              name="shipping-tier"
              checked={shippingTier === "expedited"}
              onChange={() => setShippingTier("expedited")}
              className="mt-1 shrink-0 accent-cyan-400"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">Expedited</span>
              <span className="text-xs text-ni-muted">
                ~{expressDays} business days · premium at checkout
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="relative z-0 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleWishlist}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
        >
          {wishlisted ? "On Wishlist" : "Add to Wishlist"}
        </button>
        <button
          type="button"
          onClick={handlePriceWatch}
          className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-400/50"
        >
          {watching ? "Watching Price" : "Track Price"}
        </button>
      </div>

      {actionMsg && <p className="text-center text-xs text-cyan-200">{actionMsg}</p>}

      <div className="relative z-0 grid gap-2 sm:grid-cols-2">
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
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
        >
          View Cart
        </button>
      </div>

      <div className="relative z-0">
        <button
          type="button"
          onClick={handleCheckoutNow}
          disabled={!checkoutEnabled || checkoutLoading}
          className="w-full rounded-xl bg-ni-cyan py-3 text-sm font-semibold uppercase tracking-wider text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkoutLoading ? "Redirecting…" : "Checkout Now"}
        </button>
      </div>

      {!checkoutEnabled && (
        <p className="text-center text-xs text-amber-200/90">
          Checkout is temporarily unavailable. You can still add items to your cart.
        </p>
      )}

      {checkoutError && <p className="text-center text-sm text-red-300">{checkoutError}</p>}

      <p className="text-center text-[11px] text-ni-muted">
        Prices are verified at checkout before you pay.
      </p>
    </div>
  );
}
