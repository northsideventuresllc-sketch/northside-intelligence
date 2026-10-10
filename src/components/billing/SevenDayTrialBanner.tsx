"use client";

import { useState } from "react";

/**
 * Workstream 6 — 7-day free-trial promo banner.
 *
 * Date-gated client-side so it stops rendering automatically after
 * 2026-12-01 00:00 UTC, even if the page HTML was statically generated
 * while the promo was live. Keep the copy generic so it works on every
 * IT landing page.
 */
export const SEVEN_DAY_TRIAL_PROMO_END_TS = Date.parse("2026-12-01T00:00:00.000Z");

interface SevenDayTrialBannerProps {
  toolName?: string;
}

export function SevenDayTrialBanner({ toolName }: SevenDayTrialBannerProps) {
  const [active] = useState(() => Date.now() < SEVEN_DAY_TRIAL_PROMO_END_TS);
  if (!active) return null;

  return (
    <div
      role="status"
      className="relative z-30 flex w-full items-center justify-center gap-2 border-b border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 px-4 py-2.5 text-center"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-amber-300 animate-pulse" aria-hidden="true" />
      <p className="text-xs font-medium tracking-wide text-amber-200 sm:text-sm">
        Limited-time offer: <span className="font-bold">7-day free trial</span> on{" "}
        {toolName ? `${toolName} ` : "any IT "}subscription — nothing charged until the
        trial ends. <span className="whitespace-nowrap">Ends Nov 30.</span>
      </p>
    </div>
  );
}
