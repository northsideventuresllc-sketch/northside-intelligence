"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { PriceChangeNotices } from "@/components/store/PriceChangeNotices";
import { StoreCartProvider, useStoreCart } from "@/components/store/StoreCartProvider";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import { calculateCartTotals } from "@/lib/store/cart/pricing";
import type { CartLineItem } from "@/lib/store/cart/types";
import { formatStorePrice } from "@/lib/store/client";
import type { PriceChangeNoticeView } from "@/lib/store/catalog/types";
import { STORE_PLATFORM_LABELS } from "@/lib/store/platform-labels";
import type { StoreGateStatus } from "@/lib/store/types";
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
    syncFromVerification,
    clearCart,
  } = useStoreCart();
  const [gate, setGate] = useState<StoreGateStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutNotices, setCheckoutNotices] = useState<PriceChangeNoticeView[]>([]);

  useEffect(() => {
    fetch("/api/store/gate")
      .then((r) => r.json())
      .then((json: StoreGateStatus) => setGate(json))
      .catch(() => setGate(null));
  }, []);

  const totals = useMemo(() => calculateCartTotals(items), [items]);
  const allNotices = useMemo(
    () => [...priceNotices, ...checkoutNotices],
    [priceNotices, checkoutNotices]
  );

  async function handleCheckout() {
    if (!items.length) return;
    setLoading(true);
    setError("");
    setCheckoutNotices([]);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            shippingTier: item.shippingTier,
            retailPriceCents: item.retailPriceCents,
            variantId: item.variantId,
          })),
        }),
      });
      const json = (await res.json()) as {
        url?: string;
        error?: string;
        priceChangeNotices?: PriceChangeNoticeView[];
        items?: CartLineItem[];
      };

      if (res.status === 409 && json.priceChangeNotices?.length) {
        setCheckoutNotices(json.priceChangeNotices);
        if (json.items?.length) {
          syncFromVerification(json.items, json.priceChangeNotices);
        }
        setError("CJ prices changed. Review the updates below, then try checkout again.");
        return;
      }

      if (!res.ok) throw new Error(json.error ?? "Checkout failed");
      if (!json.url) throw new Error("Checkout URL unavailable");
      clearCart();
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative px-6 pb-20 pt-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/store" className="text-sm text-cyan-300 hover:underline">
          ← Back to {SMART_STORE_NAME}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Your Cart</h1>
        <p className="mt-2 text-xs text-ni-muted">
          Your cart is saved on this device — add items anytime and return later.
        </p>

        {ordered && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Order received — fulfillment will begin shortly.
          </p>
        )}

        {verifying && items.length > 0 && (
          <p className="mt-4 text-sm text-ni-muted">Verifying live CJ prices…</p>
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
                      {formatStorePrice(item.retailPriceCents, item.currency)} · via{" "}
                      {STORE_PLATFORM_LABELS[item.sourcePlatform] ?? item.sourcePlatform}
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
              disabled={loading || verifying || !gate?.live}
              className="w-full rounded-xl bg-ni-cyan py-3 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? "Redirecting…" : "Checkout"}
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
      <StoreCartProvider>
        <Suspense
          fallback={<div className="px-6 pt-24 text-center text-ni-muted">Loading cart…</div>}
        >
          <CartContent />
        </Suspense>
      </StoreCartProvider>
      <Footer />
    </main>
  );
}
