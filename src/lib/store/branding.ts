/** User-facing Smart Store product name (not internal ni_store_* table names). */
export const SMART_STORE_NAME = "Smart Store";

/** Smart Store is a standalone commerce experience — not a Sector 3 intelligence tool. */
export const SMART_STORE_PATH = "/store";

/**
 * BUILD fix 2026-09-07 (content-machine wrong Smart Store URL bug): this used to be
 * `shop.northsideintelligence.com`. JB corrected it live — the real live store is the
 * path-based route at `src/app/store/page.tsx`, not a subdomain. Verified 2026-09-07:
 * `shop.northsideintelligence.com` has a DNS CNAME to Vercel but its TLS handshake fails
 * live (SSL_ERROR_SYSCALL, no working deployment behind it) — it is not a working alias,
 * so it is not kept as one. `northsideintelligence.com/store` returns a live 200 (via one
 * redirect hop). Every customer-facing generated caption/CTA must use this URL.
 */
export const SMART_STORE_URL = "https://northsideintelligence.com/store";

export function smartStorePageTitle(suffix?: string): string {
  if (!suffix?.trim()) return SMART_STORE_NAME;
  return `${suffix.trim()} | ${SMART_STORE_NAME}`;
}
