"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CatalogProductView, ViralPicksResponse } from "@/lib/store/catalog/types";
import { formatStorePrice } from "@/lib/store/client";
import { ViralProductCard } from "@/components/store/ViralProductCard";
import { useCarousel } from "@/hooks/useCarousel";

function wrapIndex(i: number, len: number): number {
  return ((i % len) + len) % len;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "ni_store_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

async function trackEvent(
  eventType: string,
  catalogId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch("/api/store/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        catalogId,
        sessionId: getSessionId(),
        metadata,
      }),
    });
  } catch {
    /* non-blocking */
  }
}

export function ViralProductsCarousel() {
  const [data, setData] = useState<ViralPicksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const impressedRef = useRef<Set<string>>(new Set());
  const headingId = useId();

  const picks = useMemo(() => data?.picks ?? [], [data?.picks]);
  const { safeIndex, fade, go, goTo } = useCarousel(picks.length, 7000);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/store/viral");
      const json = (await res.json()) as ViralPicksResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load viral picks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const current = picks[safeIndex];
    if (!current || impressedRef.current.has(current.id)) return;
    impressedRef.current.add(current.id);
    trackEvent("carousel_impression", current.id, { rank: current.viralRank });
  }, [picks, safeIndex]);

  const current = picks[safeIndex];
  const prev = picks.length ? picks[wrapIndex(safeIndex - 1, picks.length)] : undefined;
  const next = picks.length ? picks[wrapIndex(safeIndex + 1, picks.length)] : undefined;

  function handleProductClick(product: CatalogProductView) {
    trackEvent("click", product.id, { slug: product.slug, source: "carousel" });
  }

  if (loading) {
    return (
      <div className="glass-panel mb-10 animate-pulse p-12 text-center text-ni-muted">
        Loading today&apos;s viral picks…
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel mb-10 p-8 text-center">
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!picks.length) {
    return (
      <div className="glass-panel mb-10 p-8 text-center text-ni-muted">
        Viral picks refresh daily — check back soon.
      </div>
    );
  }

  return (
    <section className="mb-12" aria-labelledby={headingId}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Products of the Day
          </p>
          <h2 id={headingId} className="text-xl font-semibold text-white sm:text-2xl">
            {data?.personalized ? "Picked For You" : "Trending Now"}
          </h2>
          <p className="mt-1 text-xs text-ni-muted">
            Top 10 viral deals · resets{" "}
            {data?.resetsAt
              ? new Date(data.resetsAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "daily"}
            {data?.personalized ? " · personalized from your activity" : ""}
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
          {data?.pickDate}
        </span>
      </div>

      <div
        className="relative mx-auto flex min-h-[380px] max-w-4xl items-center justify-center px-2 sm:gap-6"
        style={{ perspective: "1400px" }}
      >
        {picks.length > 1 && prev && (
          <button
            type="button"
            onClick={() => go(-1)}
            className="group absolute left-0 z-10 w-[26%] max-w-[180px]"
            aria-label={`Previous: ${prev.name}`}
          >
            <div className="pointer-events-none scale-[0.82] opacity-60 blur-[2px] transition sm:scale-90">
              <ViralProductCard product={prev} variant="side" />
            </div>
          </button>
        )}

        <div
          className={`relative z-20 w-full max-w-[320px] transition-all duration-300 ${
            fade === "in" ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
          }`}
        >
          {current && (
            <ViralProductCard
              product={current}
              variant="center"
              onSelect={() => handleProductClick(current)}
            />
          )}
        </div>

        {picks.length > 1 && next && (
          <button
            type="button"
            onClick={() => go(1)}
            className="group absolute right-0 z-10 w-[26%] max-w-[180px]"
            aria-label={`Next: ${next.name}`}
          >
            <div className="pointer-events-none scale-[0.82] opacity-60 blur-[2px] transition sm:scale-90">
              <ViralProductCard product={next} variant="side" />
            </div>
          </button>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          aria-label="Previous product"
        >
          ←
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-white">{current?.name}</span>
          <span className="text-lg font-bold text-cyan-300">
            {current ? formatStorePrice(current.retailPriceCents, current.currency) : ""}
          </span>
          <span className="text-xs text-ni-muted">
            {safeIndex + 1} / {picks.length}
          </span>
          <div className="mt-1 flex gap-1.5">
            {picks.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to ${p.name}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20 hover:bg-cyan-400/50"
                }`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          aria-label="Next product"
        >
          →
        </button>
      </div>
    </section>
  );
}
