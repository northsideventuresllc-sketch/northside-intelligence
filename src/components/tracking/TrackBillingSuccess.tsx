"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/components/MetaPixel";

/**
 * Fires the standard Subscribe event when Stripe redirects back to /toolkit
 * after a successful billing checkout (?checkout=success, ?upgraded=<tier>,
 * or ?purchased=<toolSlug>). Must be rendered inside a <Suspense> boundary.
 */
export function TrackBillingSuccess() {
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const upgraded = searchParams.get("upgraded");
    const purchased = searchParams.get("purchased");
    const checkout = searchParams.get("checkout");
    if (checkout === "success" || upgraded || purchased) {
      fired.current = true;
      trackEvent("Subscribe", {
        content_name: upgraded ?? purchased ?? "ni-subscription",
        currency: "USD",
      });
    }
  }, [searchParams]);

  return null;
}
