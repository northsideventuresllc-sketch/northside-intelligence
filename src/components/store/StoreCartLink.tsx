"use client";

import Link from "next/link";
import { useStoreCart } from "@/components/store/StoreCartProvider";

export function StoreCartLink() {
  const { itemCount } = useStoreCart();

  return (
    <Link
      href="/store/cart"
      className="relative shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
    >
      Cart
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-ni-cyan px-1 text-[10px] font-bold text-ni-bg">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
