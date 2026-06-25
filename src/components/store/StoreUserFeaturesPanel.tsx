"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StoreProductImage } from "@/components/store/StoreProductImage";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import type {
  PriceWatchItem,
  SearchHistoryItem,
  WishlistItem,
} from "@/lib/store/user-features-types";

type Tab = "history" | "wishlist" | "price-watches";

export function StoreUserFeaturesPanel() {
  const [tab, setTab] = useState<Tab>("history");
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [watches, setWatches] = useState<PriceWatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const type =
        tab === "wishlist" ? "wishlist" : tab === "price-watches" ? "price-watches" : "history";
      const res = await fetch(`/api/store/user-features?type=${type}`);
      if (res.status === 401) {
        setSignedIn(false);
        return;
      }
      const data = (await res.json()) as { items?: unknown[] };
      if (tab === "history") setHistory((data.items ?? []) as SearchHistoryItem[]);
      if (tab === "wishlist") setWishlist((data.items ?? []) as WishlistItem[]);
      if (tab === "price-watches") setWatches((data.items ?? []) as PriceWatchItem[]);
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeItem(id: string) {
    const type =
      tab === "wishlist" ? "wishlist" : tab === "price-watches" ? "price-watches" : "history";
    await fetch(`/api/store/user-features?type=${type}&id=${id}`, { method: "DELETE" });
    void load();
  }

  async function clearHistory() {
    await fetch("/api/store/user-features?type=history&id=all", { method: "DELETE" });
    void load();
  }

  if (!signedIn) {
    return (
      <section className="glass-panel p-4" aria-label="Your Smart Store">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
          Your Lists
        </p>
        <p className="mt-2 text-sm text-ni-muted">
          <Link href="/auth/sign-in" className="text-cyan-300 hover:underline">
            Sign In
          </Link>{" "}
          to save search history, wishlist items, and price watches.
        </p>
      </section>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "history", label: "History" },
    { id: "wishlist", label: "Wishlist" },
    { id: "price-watches", label: "Price Tracker" },
  ];

  return (
    <section className="glass-panel p-4" aria-label="Your Smart Store lists">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
        Your Lists
      </p>

      <div className="mb-3 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
              tab === t.id
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-xs text-ni-muted">Loading…</p>}

      {!loading && tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-ni-muted">No viewed items in the last 365 days.</p>
          ) : (
            <>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2"
                  >
                    {item.imageUrl ? (
                      <StoreProductImage
                        src={item.imageUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 object-cover"
                      />
                    ) : (
                      <span className="h-8 w-8 shrink-0" />
                    )}
                    <Link
                      href={`/store/p/${item.productSlug}`}
                      className="min-w-0 flex-1 truncate text-xs text-white hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 text-[10px] text-ni-muted hover:text-red-300"
                      aria-label="Remove from history"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={clearHistory}
                className="text-[10px] font-semibold text-ni-muted hover:text-red-300"
              >
                Clear History
              </button>
            </>
          )}
        </div>
      )}

      {!loading && tab === "wishlist" && (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {wishlist.length === 0 ? (
            <p className="text-xs text-ni-muted">Save items for later from any product page.</p>
          ) : (
            wishlist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2"
              >
                {item.imageUrl ? (
                  <StoreProductImage
                    src={item.imageUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 object-cover"
                  />
                ) : (
                  <span className="h-8 w-8 shrink-0" />
                )}
                <Link
                  href={`/store/p/${item.productSlug}`}
                  className="min-w-0 flex-1 truncate text-xs text-white hover:underline"
                >
                  {item.productName}
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-[10px] text-ni-muted hover:text-red-300"
                  aria-label="Remove from wishlist"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && tab === "price-watches" && (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {watches.length === 0 ? (
            <p className="text-xs text-ni-muted">
              Track prices from any product page. You&apos;ll get portal and email alerts on changes.
            </p>
          ) : (
            watches.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-2"
              >
                <Link
                  href={`/store/p/${item.productSlug}`}
                  className="min-w-0 flex-1 truncate text-xs text-white hover:underline"
                >
                  {item.productName}
                </Link>
                <span className="shrink-0 text-[10px] text-cyan-200">
                  {formatRetailPriceRange(item.lastKnownRetailCents, null, null)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-[10px] text-ni-muted hover:text-red-300"
                  aria-label="Stop tracking price"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
