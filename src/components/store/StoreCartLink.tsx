"use client";

import Link from "next/link";
import { useStoreCart } from "@/components/store/StoreCartProvider";
import { StoreCartIcon } from "@/components/store/StoreCartIcon";

interface StoreCartLinkProps {
  className?: string;
  showLabel?: boolean;
}

export function StoreCartLink({ className = "", showLabel = false }: StoreCartLinkProps) {
  const { itemCount } = useStoreCart();

  return (
    <Link
      href="/store/cart"
      className={`relative inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 ${className}`}
      aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
    >
      <StoreCartIcon />
      {showLabel && <span className="text-sm font-semibold">Cart</span>}
      <span
        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
          itemCount > 0
            ? "bg-ni-cyan text-ni-bg"
            : "border border-white/15 bg-white/5 text-ni-muted"
        }`}
      >
        {itemCount > 99 ? "99+" : itemCount}
      </span>
    </Link>
  );
}
