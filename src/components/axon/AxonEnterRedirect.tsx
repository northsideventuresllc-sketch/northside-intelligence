"use client";

import { useEffect } from "react";

/**
 * Full browser navigation to the bootstrap endpoint. It must be
 * window.location, not the Next router — the router would try to read an RSC
 * payload from an API route and render a blank page, which is the exact bug
 * this page exists to fix.
 */
export function AxonEnterRedirect({ target }: { target: string }) {
  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return null;
}
