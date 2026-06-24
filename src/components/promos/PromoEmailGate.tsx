"use client";

import { useState } from "react";
import { EmailListOptIn } from "@/components/email/EmailListOptIn";

interface PromoEmailGateProps {
  onSubscribed: () => void;
}

export function PromoEmailGate({ onSubscribed }: PromoEmailGateProps) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleSubscribed() {
    setRefreshing(true);
    onSubscribed();
    setRefreshing(false);
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-cyan-500/20 bg-ni-navy/50 p-8 text-center shadow-xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
        <svg className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white">Join the Email List</h2>
      <p className="mt-2 text-sm text-ni-muted">
        Subscribe to unlock your personalized promos. We send weekly deals, product launches,
        and Smart Store savings — tailored to your account.
      </p>
      <div className="mt-6">
        <EmailListOptIn standalone onSubscribed={handleSubscribed} />
      </div>
      {refreshing && (
        <p className="mt-4 text-xs text-ni-muted">Loading your promos…</p>
      )}
    </div>
  );
}
