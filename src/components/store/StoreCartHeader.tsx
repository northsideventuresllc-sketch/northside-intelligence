"use client";

import { StoreCartLink } from "@/components/store/StoreCartLink";
import { useStoreGate } from "@/components/store/StoreGateProvider";
import { useStoreCheckout } from "@/hooks/useStoreCheckout";

interface StoreCartHeaderProps {
  showCheckout?: boolean;
}

export function StoreCartHeader({ showCheckout = true }: StoreCartHeaderProps) {
  const gate = useStoreGate();
  const { checkout, loading, error, setError, itemCount } = useStoreCheckout();
  const checkoutEnabled = gate.live && itemCount > 0;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <StoreCartLink />
        {showCheckout && (
          <button
            type="button"
            onClick={() => {
              setError("");
              void checkout();
            }}
            disabled={!checkoutEnabled || loading}
            className="rounded-xl bg-ni-cyan px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ni-bg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Checkout Now"}
          </button>
        )}
      </div>
      {error && <p className="max-w-xs text-right text-[11px] text-red-300">{error}</p>}
    </div>
  );
}
