"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { PriceChangeNotices } from "@/components/store/PriceChangeNotices";
import { StoreCartHeader } from "@/components/store/StoreCartHeader";
import { useStoreCart } from "@/components/store/StoreCartProvider";
import { useStoreGate } from "@/components/store/StoreGateProvider";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import { calculateCartTotals } from "@/lib/store/cart/pricing";
import type { CartLineItem } from "@/lib/store/cart/types";
import { formatStorePrice } from "@/lib/store/client";
import { useStoreCheckout } from "@/hooks/useStoreCheckout";
import type { PriceChangeNoticeView } from "@/lib/store/catalog/types";
import type { ShippingTier } from "@/lib/store/cart/types";
import { SMART_STORE_NAME } from "@/lib/store/branding";

function cartLineKey(item: Pick<CartLineItem, "slug" | "variantId">): string {
  return `${item.slug}::${item.variantId ?? ""}`;
}

function CartContent() {
  const searchParams = useSearchParams();
  const ordered = searchParams.get("ordered") === "1";
  const {
    items,
    itemCount,
    priceNotices,
    verifying,
    removeItem,
    updateQuantity,
    updateShippingTier,
    clearCart,
  } = useStoreCart();
  const gate = useStoreGate();
  const { checkout, loading, error, setError } = useStoreCheckout();
  const [checkoutNotices, setCheckoutNotices] = useState<PriceChangeNoticeView[]>([]);

  useEffect(() => {
    if (ordered) clearCart();
  }, [ordered, clearCart]);

  const totals = useMemo(() => calculateCartTotals(items), [items]);
  const allNotices = useMemo(
    () => {
      const seen = new Set<string>();
      return [...priceNotices, ...checkoutNotices].filter((notice) => {
        if (seen.has(notice.slug)) return false;
        seen.add(notice.slug);
        return true;
      });
    },
    [priceNotices, checkoutNotices]
  );

  async function handleCheckout() {
    setError("");
    setCheckoutNotices([]);
    const result = await checkout();
    if (!result.ok && result.priceChangeNotices?.length) {
      setCheckoutNotices(result.priceChangeNotices);
    }
  }

  const checkoutEnabled = gate.live && items.length > 0;

  return (
    <section className="relative px-6 pb-28 pt-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/store" className="text-sm text-cyan-300 hover:underline">
            ← Back to {SMART_STORE_NAME}
          </Link>
          <StoreCartHeader showCheckout={false} />
        </div>
        <h1 className="text-2xl font-semibold text-white">Your Cart</h1>
        <p className="mt-2 text-xs text-ni-muted">
          Your cart is saved on this device — add items anytime and return later.
        </p>

        {ordered && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Order received — fulfillment will begin shortly.
          </p>
        )}

        {verifying && items.length > 0 && (
          <p className="mt-4 text-sm text-ni-muted">Verifying live prices…</p>
        )}

        {allNotices.length > 0 && (
          <PriceChangeNotices notices={allNotices} className="mt-4" />
        )}

        {!items.length && !ordered && (
          <p className="mt-8 text-sm text-ni-muted">Your cart is empty.</p>
        )}

        {items.length > 0 && (
          <div className="mt-8 space-y-4">
            {items.map((item) => {
              const lineKey = cartLineKey(item);
              return (
                <article key={lineKey} className="glass-panel flex gap-4 p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    {item.imageUrl ? (
                      <StoreProductImage
                        src={item.imageUrl}
                        alt={item.name}
                        width={72}
                        height={72}
                        className="max-h-16 object-contain"
                      />
                    ) : (
                      <span className="text-xs text-ni-muted">No Image</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/store/p/${item.slug}`}
                      className="font-semibold text-white hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-ni-muted">
                      {formatStorePrice(item.retailPriceCents, item.currency)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="text-xs text-ni-muted">
                        Qty
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.slug, Number(e.target.value), item.variantId)
                          }
                          className="ml-2 w-14 rounded border border-white/10 bg-white/5 px-2 py-1 text-white"
                        />
                      </label>
                      <select
                        value={item.shippingTier}
                        onChange={(e) =>
                          updateShippingTier(
                            item.slug,
                            e.target.value as ShippingTier,
                            item.variantId
                          )
                        }
                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                      >
                        <option value="standard">Standard</option>
                        <option value="expedited">Expedited</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeItem(item.slug, item.variantId)}
                        className="text-xs font-semibold text-red-300 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            <div className="glass-panel space-y-2 p-4 text-sm">
              <div className="flex justify-between text-ni-muted">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatStorePrice(totals.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-ni-muted">
                <span>Est. Shipping & Handling</span>
                <span>{formatStorePrice(totals.shippingCents)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold text-white">
                <span>Total</span>
                <span>{formatStorePrice(totals.totalCents)}</span>
              </div>
              <p className="text-[11px] text-ni-muted">
                Prices are verified against CJ at checkout. NI retail = CJ listing price + 10%.
                Shipping is estimated at checkout. Any unused amount is refunded after fulfillment.
              </p>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!checkoutEnabled || loading}
              className="w-full rounded-xl bg-ni-cyan py-3 text-sm font-semibold uppercase tracking-wider text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Redirecting…" : "Checkout Now"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function StoreCartPage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <Suspense
        fallback={<div className="px-6 pt-24 text-center text-ni-muted">Loading cart…</div>}
      >
        <CartContent />
      </Suspense>
      <Footer />
    </main>
  );
}
