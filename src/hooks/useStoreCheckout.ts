"use client";

import { useCallback, useState } from "react";
import type { CartLineItem } from "@/lib/store/cart/types";
import type { PriceChangeNoticeView } from "@/lib/store/catalog/types";
import { useStoreCart } from "@/components/store/StoreCartProvider";

interface CheckoutResult {
  ok: boolean;
  priceChangeNotices?: PriceChangeNoticeView[];
  items?: CartLineItem[];
}

export function useStoreCheckout() {
  const { items, verifying, syncFromVerification, clearCart } = useStoreCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkout = useCallback(
    async (lines: CartLineItem[] = items): Promise<CheckoutResult> => {
      if (!lines.length) {
        setError("Your cart is empty.");
        return { ok: false };
      }

      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/store/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lines.map((item) => ({
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
          if (json.items?.length) {
            syncFromVerification(json.items, json.priceChangeNotices);
          }
          setError("Prices changed. Review your cart and try again.");
          return {
            ok: false,
            priceChangeNotices: json.priceChangeNotices,
            items: json.items,
          };
        }

        if (!res.ok) throw new Error(json.error ?? "Checkout failed");
        if (!json.url) throw new Error("Checkout URL unavailable");

        clearCart();
        window.location.href = json.url;
        return { ok: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Checkout failed";
        setError(message);
        return { ok: false };
      } finally {
        setLoading(false);
      }
    },
    [items, syncFromVerification, clearCart]
  );

  return { checkout, loading, error, setError, verifying, itemCount: items.length };
}
