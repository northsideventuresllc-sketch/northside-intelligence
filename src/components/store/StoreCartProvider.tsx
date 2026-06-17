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

interface AddItemInput {
  slug: string;
  name: string;
  imageUrl: string | null;
  retailPriceCents: number;
  currency: string;
  sourcePlatform: string;
  sourceProductId?: string | null;
  quantity?: number;
  shippingTier?: ShippingTier;
}

interface StoreCartContextValue {
  items: CartLineItem[];
  itemCount: number;
  addItem: (item: AddItemInput) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  updateShippingTier: (slug: string, tier: ShippingTier) => void;
  clearCart: () => void;
}

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

function loadCart(): CartState {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as CartState;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function persistCart(state: CartState) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
}

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart().items);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistCart({ items });
  }, [items, hydrated]);

  const addItem = useCallback((input: AddItemInput) => {
    const qty = Math.max(1, Math.min(10, input.quantity ?? 1));
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === input.slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === input.slug
            ? { ...i, quantity: Math.min(10, i.quantity + qty), shippingTier: input.shippingTier ?? i.shippingTier }
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
          quantity: qty,
          shippingTier: input.shippingTier ?? "standard",
        },
      ];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    const qty = Math.max(1, Math.min(10, quantity));
    setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, quantity: qty } : i)));
  }, []);

  const updateShippingTier = useCallback((slug: string, tier: ShippingTier) => {
    setItems((prev) => prev.map((i) => (i.slug === slug ? { ...i, shippingTier: tier } : i)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      addItem,
      removeItem,
      updateQuantity,
      updateShippingTier,
      clearCart,
    }),
    [items, itemCount, addItem, removeItem, updateQuantity, updateShippingTier, clearCart]
  );

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

export function useStoreCart(): StoreCartContextValue {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error("useStoreCart must be used within StoreCartProvider");
  return ctx;
}
