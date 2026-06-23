"use client";

import { useEffect, useState } from "react";
import { StoreCartLink } from "@/components/store/StoreCartLink";
import { useStoreCheckout } from "@/hooks/useStoreCheckout";
import type { StoreGateStatus } from "@/lib/store/types";

interface StoreCartHeaderProps {
  showCheckout?: boolean;
}

export function StoreCartHeader({ showCheckout = true }: StoreCartHeaderProps) {
  const { checkout, loading, verifying, itemCount } = useStoreCheckout();
  const [gate, setGate] = useState<StoreGateStatus | null>(null);

  useEffect(() => {
    fetch("/api/store/gate")
      .then((r) => r.json())
      .then((json: StoreGateStatus) => setGate(json))
      .catch(() => setGate(null));
  }, []);

  const checkoutEnabled = Boolean(gate?.live) && itemCount > 0 && !verifying;

  return (
    <div className="flex items-center gap-2">
      <StoreCartLink />
      {showCheckout && (
        <button
          type="button"
          onClick={() => checkout()}
          disabled={!checkoutEnabled || loading}
          className="rounded-xl bg-ni-cyan px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Redirecting…" : "Checkout Now"}
        </button>
      )}
    </div>
  );
}
