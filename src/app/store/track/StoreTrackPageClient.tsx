"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatStorePrice } from "@/lib/store/client";
import { SMART_STORE_NAME } from "@/lib/store/branding";

interface TrackedOrder {
  ref: string;
  status: string;
  statusLabel: string;
  totalCents: number;
  currency: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPriceCents: number;
    shippingTier: string;
  }>;
}

export function StoreTrackPageClient() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") ?? "";
  const initialEmail = searchParams.get("email") ?? "";

  const [ref, setRef] = useState(initialRef);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const lookup = useCallback(async (nextRef = ref, nextEmail = email) => {
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const params = new URLSearchParams({
        ref: nextRef.trim(),
        email: nextEmail.trim(),
      });
      const res = await fetch(`/api/store/orders/track?${params.toString()}`);
      const json = (await res.json()) as { error?: string; order?: TrackedOrder };

      if (!res.ok) {
        throw new Error(json.error ?? "Unable to find order");
      }

      setOrder(json.order ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to find order");
    } finally {
      setLoading(false);
    }
  }, [email, ref]);

  useEffect(() => {
    if (initialRef && initialEmail) {
      void lookup(initialRef, initialEmail);
    }
  }, [initialRef, initialEmail, lookup]);

  return (
    <section className="relative px-6 pb-28 pt-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/store" className="text-sm text-cyan-300 hover:underline">
          ← Back to {SMART_STORE_NAME}
        </Link>

        <h1 className="mt-6 text-2xl font-semibold text-white">Track Your Order</h1>
        <p className="mt-2 text-sm text-ni-muted">
          Enter your order number and checkout email. Guest orders are supported.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup();
          }}
        >
          <label className="block text-sm text-ni-muted">
            Order Number
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. 908A8F2F"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-500/40"
              required
            />
          </label>

          <label className="block text-sm text-ni-muted">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-500/40"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-ni-cyan py-3 text-sm font-semibold uppercase tracking-wider text-ni-bg transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Looking Up…" : "Track Order"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        {order && (
          <div className="glass-panel mt-8 space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-ni-muted">Order</p>
                <p className="text-lg font-semibold text-white">#{order.ref}</p>
              </div>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                {order.statusLabel}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={`${item.productName}-${item.quantity}`} className="flex justify-between gap-4">
                  <span className="text-ni-muted">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="text-white">
                    {formatStorePrice(item.unitPriceCents * item.quantity, order.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t border-white/10 pt-3 text-sm font-semibold text-white">
              <span>Total</span>
              <span>{formatStorePrice(order.totalCents, order.currency)}</span>
            </div>

            {order.trackingNumber ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                <p className="text-ni-muted">Carrier: {order.trackingCarrier ?? "Carrier"}</p>
                <p className="mt-1 text-white">Tracking: {order.trackingNumber}</p>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-cyan-300 hover:underline"
                  >
                    Open Carrier Tracking
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-ni-muted">
                Tracking will appear here once your package ships.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
