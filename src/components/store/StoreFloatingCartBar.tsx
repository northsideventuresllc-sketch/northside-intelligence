"use client";

import Link from "next/link";
import { useStoreCart } from "@/components/store/StoreCartProvider";
import { StoreCartIcon } from "@/components/store/StoreCartIcon";
import { useStoreGate } from "@/components/store/StoreGateProvider";
import { useStoreCheckout } from "@/hooks/useStoreCheckout";
import { formatStorePrice } from "@/lib/store/client";
import { calculateCartTotals } from "@/lib/store/cart/pricing";

export function StoreFloatingCartBar() {
  const { items, itemCount } = useStoreCart();
  const gate = useStoreGate();
  const { checkout, loading, error, setError } = useStoreCheckout();

  if (itemCount === 0) return null;

  const totals = calculateCartTotals(items);
  const checkoutEnabled = gate.live;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyan-500/20 bg-ni-bg/95 px-4 py-3 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl">
        {error && (
          <p className="mb-2 text-center text-xs text-red-300">{error}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/store/cart"
            className="flex min-w-0 items-center gap-3 text-white transition hover:text-cyan-200"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <StoreCartIcon />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ni-cyan px-1 text-[10px] font-bold text-ni-bg">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {itemCount} item{itemCount === 1 ? "" : "s"} in cart
              </span>
              <span className="block text-xs text-ni-muted">
                {formatStorePrice(totals.totalCents)}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setError("");
              void checkout();
            }}
            disabled={!checkoutEnabled || loading}
            className="shrink-0 rounded-xl bg-ni-cyan px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Checkout Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
