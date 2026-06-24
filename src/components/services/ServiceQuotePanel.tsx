"use client";

import { useState } from "react";
import type { PaymentPlanOption, ServiceQuoteResult } from "@/lib/services/pricing-engine";
import { formatCents, formatCentsMonthly } from "@/lib/services/pricing-engine";
import { ServiceNegotiationChat } from "@/components/services/ServiceNegotiationChat";

interface ServiceQuotePanelProps {
  quote: ServiceQuoteResult & { quoteId: string };
  currentPriceCents: number;
  onPriceChange: (cents: number) => void;
}

export function ServiceQuotePanel({
  quote,
  currentPriceCents,
  onPriceChange,
}: ServiceQuotePanelProps) {
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "plan" | "bnpl">("full");
  const [planMonths, setPlanMonths] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  async function handleCheckout() {
    setCheckoutError("");
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/services/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.quoteId,
          paymentType,
          planMonths: paymentType === "plan" ? planMonths : 1,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setCheckoutError(data.error ?? "Checkout failed");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckoutError("Network error. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handleNegotiationAccept(priceCents: number) {
    onPriceChange(priceCents);
    setNegotiateOpen(false);
  }

  const selectedPlan = quote.paymentPlans.find((p) => p.months === planMonths);

  return (
    <>
      <div className="glass-panel space-y-6 p-8">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Your Custom Quote
          </p>
          <p className="text-4xl font-semibold text-white">{formatCents(currentPriceCents)}</p>
          {quote.isIndividualPricing && (
            <p className="mt-1 text-xs text-cyan-300/80">Individual pricing applied</p>
          )}
          <p className="mt-2 text-sm text-ni-muted">
            Range: {formatCents(quote.floorPriceCents)} – {formatCents(quote.topPriceCents)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm font-semibold text-white">Why This Price</p>
          <ul className="space-y-2">
            {quote.reasoning.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm text-ni-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400/60" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {quote.lineItems.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-sm font-semibold text-white">Price Breakdown</p>
            <div className="space-y-2">
              {quote.lineItems.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-ni-muted">{item.label}</span>
                  <span className={item.amountCents < 0 ? "text-emerald-300" : "text-white"}>
                    {item.amountCents < 0 ? "−" : ""}
                    {formatCents(Math.abs(item.amountCents))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-sm font-semibold text-white">Payment Options</p>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 px-3 py-2 transition hover:border-cyan-500/30">
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === "full"}
                onChange={() => setPaymentType("full")}
                className="accent-cyan-400"
              />
              <span className="text-sm text-white">Pay In Full — {formatCents(currentPriceCents)}</span>
            </label>

            {quote.paymentPlans.filter((p) => p.months > 1).map((plan) => (
              <PlanOption
                key={plan.months}
                plan={plan}
                selected={paymentType === "plan" && planMonths === plan.months}
                onSelect={() => {
                  setPaymentType("plan");
                  setPlanMonths(plan.months);
                }}
              />
            ))}

            {quote.bnplEligible && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 px-3 py-2 transition hover:border-cyan-500/30">
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === "bnpl"}
                  onChange={() => setPaymentType("bnpl")}
                  className="accent-cyan-400"
                />
                <div>
                  <span className="text-sm text-white">Pay Over Time (Affirm / Klarna)</span>
                  <p className="text-xs text-ni-muted">
                    Soft credit check at checkout — subject to approval
                  </p>
                </div>
              </label>
            )}
          </div>

          {paymentType === "plan" && selectedPlan && selectedPlan.months > 1 && (
            <p className="mt-3 text-xs text-ni-muted">
              {formatCentsMonthly(selectedPlan.monthlyCents)} × {selectedPlan.months} months ={" "}
              {formatCents(selectedPlan.totalCents)} total. First payment due at checkout.
            </p>
          )}
        </div>

        {checkoutError && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
            {checkoutError}
          </p>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkoutLoading}
          className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/15 py-4 text-base font-semibold text-cyan-300 transition hover:bg-cyan-500/25 disabled:opacity-50"
        >
          {checkoutLoading ? "Redirecting…" : "Proceed With Payment"}
        </button>

        <p className="text-center">
          <button
            type="button"
            onClick={() => setNegotiateOpen(true)}
            className="text-sm font-medium text-cyan-300 underline-offset-2 transition hover:underline"
          >
            Request a Lower Price
          </button>
        </p>
      </div>

      <ServiceNegotiationChat
        isOpen={negotiateOpen}
        onClose={() => setNegotiateOpen(false)}
        quoteId={quote.quoteId}
        serviceName={quote.serviceName}
        initialPriceCents={currentPriceCents}
        floorPriceCents={quote.floorPriceCents}
        onAccept={handleNegotiationAccept}
      />
    </>
  );
}

function PlanOption({
  plan,
  selected,
  onSelect,
}: {
  plan: PaymentPlanOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 px-3 py-2 transition hover:border-cyan-500/30">
      <input
        type="radio"
        name="paymentType"
        checked={selected}
        onChange={onSelect}
        className="accent-cyan-400"
      />
      <span className="text-sm text-white">
        {plan.label} — {formatCentsMonthly(plan.monthlyCents)}
      </span>
    </label>
  );
}
