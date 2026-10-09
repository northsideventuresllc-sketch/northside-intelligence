"use client";

import { useEffect } from "react";
import { trackEvent } from "@/components/MetaPixel";

/** Fires the standard ViewContent event once when a tool landing page mounts. */
export function TrackViewContent({ contentName }: { contentName: string }) {
  useEffect(() => {
    trackEvent("ViewContent", { content_name: contentName });
  }, [contentName]);
  return null;
}
