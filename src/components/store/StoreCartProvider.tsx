"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  type CartLineItem,
  type CartState,
  type ShippingTier,
} from "@/lib/store/cart/types";
import type { PriceChangeNoticeView } from "@/lib/store/catalog/types";

interface AddItemInput {
  slug: string;
  name: string;
  imageUrl: string | null;
  retailPriceCents: number;
  currency: string;
  sourcePlatform: string;
  sourceProductId?: string | null;
  variantId?: string | null;
  quantity?: number;
  shippingTier?: ShippingTier;
}

interface StoreCartContextValue {
  items: CartLineItem[];
  itemCount: number;
  priceNotices: PriceChangeNoticeView[];
  verifying: boolean;
  addItem: (item: AddItemInput) => void;
  removeItem: (slug: string, variantId?: string | null) => void;
  updateQuantity: (slug: string, quantity: number, variantId?: string | null) => void;
  updateShippingTier: (slug: string, tier: ShippingTier, variantId?: string | null) => void;
  syncFromVerification: (items: CartLineItem[], notices: PriceChangeNoticeView[]) => void;
  clearCart: () => void;
}

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((item) => ({
          ...item,
          variantId: item.variantId ?? null,
        }))
      : [];
    return { items, savedAt: parsed.savedAt };
  } catch {
    return { items: [] };
  }
}

function persistCart(state: CartState) {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify({ ...state, savedAt: new Date().toISOString() })
  );
}

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [priceNotices, setPriceNotices] = useState<PriceChangeNoticeView[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart().items);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistCart({ items });
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated || !items.length) return;

    let cancelled = false;
    setVerifying(true);

    const snapshot = items.map((item) => ({
      slug: item.slug,
      retailPriceCents: item.retailPriceCents,
      variantId: item.variantId,
    }));

    fetch("/api/store/cart/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: snapshot }),
    })
      .then(async (res) => res.json())
      .then(
        (json: {
          items?: Array<{
            slug: string;
            name: string;
            imageUrl: string | null;
            retailPriceCents: number;
            currency: string;
            sourcePlatform: string;
            variantId?: string | null;
          }>;
          priceChangeNotices?: PriceChangeNoticeView[];
          unavailable?: string[];
        }) => {
          if (cancelled) return;
          const notices = json.priceChangeNotices ?? [];
          setPriceNotices(notices);

          const syncedByKey = new Map(
            (json.items ?? []).map((item) => [
              `${item.slug}::${item.variantId ?? ""}`,
              item,
            ])
          );
          setItems((prev) =>
            prev
              .filter((item) => !json.unavailable?.includes(item.slug))
              .map((item) => {
                const key = `${item.slug}::${item.variantId ?? ""}`;
                const synced = syncedByKey.get(key);
                if (!synced) return item;
                return {
                  ...item,
                  name: synced.name,
                  imageUrl: synced.imageUrl,
                  retailPriceCents: synced.retailPriceCents,
                  currency: synced.currency,
                  sourcePlatform: synced.sourcePlatform,
                };
              })
          );
        }
      )
      .catch(() => {
        if (!cancelled) setPriceNotices([]);
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
    // Verify saved cart once after hydration — not on every quantity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const addItem = useCallback((input: AddItemInput) => {
    const qty = Math.max(1, Math.min(10, input.quantity ?? 1));
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.slug === input.slug && (i.variantId ?? null) === (input.variantId ?? null)
      );
      if (existing) {
        return prev.map((i) =>
          i.slug === input.slug && (i.variantId ?? null) === (input.variantId ?? null)
            ? {
                ...i,
                quantity: Math.min(10, i.quantity + qty),
                shippingTier: input.shippingTier ?? i.shippingTier,
                retailPriceCents: input.retailPriceCents,
                name: input.name,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          slug: input.slug,
          name: input.name,
          imageUrl: input.imageUrl,
          retailPriceCents: input.retailPriceCents,
          currency: input.currency,
          sourcePlatform: input.sourcePlatform,
          sourceProductId: input.sourceProductId ?? null,
          variantId: input.variantId ?? null,
          quantity: qty,
          shippingTier: input.shippingTier ?? "standard",
        },
      ];
    });
  }, []);

  const removeItem = useCallback((slug: string, variantId?: string | null) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.slug === slug && (i.variantId ?? null) === (variantId ?? null))
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (slug: string, quantity: number, variantId?: string | null) => {
      const qty = Math.max(1, Math.min(10, quantity));
      setItems((prev) =>
        prev.map((i) =>
          i.slug === slug && (i.variantId ?? null) === (variantId ?? null)
            ? { ...i, quantity: qty }
            : i
        )
      );
    },
    []
  );

  const updateShippingTier = useCallback(
    (slug: string, tier: ShippingTier, variantId?: string | null) => {
      setItems((prev) =>
        prev.map((i) =>
          i.slug === slug && (i.variantId ?? null) === (variantId ?? null)
            ? { ...i, shippingTier: tier }
            : i
        )
      );
    },
    []
  );

  const syncFromVerification = useCallback(
    (nextItems: CartLineItem[], notices: PriceChangeNoticeView[]) => {
      setItems(nextItems);
      setPriceNotices(notices);
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setPriceNotices([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      priceNotices,
      verifying,
      addItem,
      removeItem,
      updateQuantity,
      updateShippingTier,
      syncFromVerification,
      clearCart,
    }),
    [
      items,
      itemCount,
      priceNotices,
      verifying,
      addItem,
      removeItem,
      updateQuantity,
      updateShippingTier,
      syncFromVerification,
      clearCart,
    ]
  );

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

export function useStoreCart(): StoreCartContextValue {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error("useStoreCart must be used within StoreCartProvider");
  return ctx;
}
