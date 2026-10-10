"use client";

import { useState } from "react";
import type { UserBillingState } from "@/lib/billing/entitlements";

interface AddToToolkitButtonProps {
  toolSlug: string;
  toolName: string;
  billingState: UserBillingState;
  className?: string;
}

/**
 * For NI plan holders (Core/Pro/Power): "Add to toolkit" instead of
 * "Subscribe to SaaS". On success shows remaining slot counts.
 */
export function AddToToolkitButton({
  toolSlug,
  toolName,
  billingState,
  className,
}: AddToToolkitButtonProps) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [remaining, setRemaining] = useState({ saas: 0, agentic: 0 });

  async function handleAdd() {
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/billing/toolkit/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add to toolkit.");
        return;
      }
      const saasLimit = billingState.toolSlotLimit;
      const agenticLimit = billingState.agenticSlotLimit;
      setRemaining({
        saas:
          saasLimit === null
            ? 999
            : Math.max(0, saasLimit - (billingState.toolSlotsUsed + 1)),
        agentic:
          agenticLimit === null
            ? 999
            : Math.max(0, agenticLimit - billingState.agenticSlotsUsed),
      });
      setShowPopup(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  const fmt = (n: number) => (n >= 999 ? "unlimited" : String(n));

  return (
    <>
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className={
          className ??
          "w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 py-3 text-xs font-semibold text-white transition hover:bg-emerald-500/25 disabled:opacity-50"
        }
      >
        {adding ? "Adding…" : `Add ${toolName} to toolkit`}
      </button>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0d1420] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-white">
              {toolName} added to your toolbox!
            </p>
            <p className="mt-3 text-sm text-white/75">
              You have {fmt(remaining.saas)} SaaS Intelligence Tool{" "}
              {remaining.saas === 1 ? "spot" : "spots"} and{" "}
              {fmt(remaining.agentic)} Agentic Intelligence Tool{" "}
              {remaining.agentic === 1 ? "spot" : "spots"} to add to your
              toolbox — you can interchange tools at any time.
            </p>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="mt-5 w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
