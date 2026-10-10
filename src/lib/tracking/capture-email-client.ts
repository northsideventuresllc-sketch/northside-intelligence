/**
 * Client-side companion to src/lib/tracking/email-capture.ts.
 *
 * Call `captureEmailLead(email, sourceTool)` from any form's success path.
 * It (a) fires the Meta `Lead` event through the existing pixel helper
 * (trackEvent in @/components/MetaPixel — no duplicate pixel), and
 * (b) fire-and-forget POSTs to /api/track/email-capture for the server-side
 * 72h record. Never throws, never blocks the UX.
 */
import { trackEvent } from "@/components/MetaPixel";

export function captureEmailLead(email: string, sourceTool: string): void {
  try {
    const v = (email ?? "").trim();
    if (!v) return;

    // (a) Meta pixel — reuses the deployed MetaPixel, nothing new to load.
    trackEvent("Lead", { content_name: sourceTool });

    // (b) Server-side 72h capture. Fire-and-forget: the API routes that own
    // these forms also call recordEmailCapture() directly, and the server
    // dedupes by email hash, so a double-write is harmless.
    const body = JSON.stringify({
      email: v,
      sourceTool,
      sourcePage:
        typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    if (typeof fetch !== "undefined") {
      void fetch("/api/track/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        /* capture must never break the form */
      });
    }
  } catch {
    /* capture must never break the form */
  }
}
