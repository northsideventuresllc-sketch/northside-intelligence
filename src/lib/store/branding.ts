/** User-facing Smart Store product name (not internal ni_store_* table names). */
export const SMART_STORE_NAME = "Smart Store";

/** Smart Store is a standalone commerce experience — not a Sector 3 intelligence tool. */
export const SMART_STORE_PATH = "/store";

export const SMART_STORE_SUBDOMAIN = "shop.northsideintelligence.com";

export function smartStorePageTitle(suffix?: string): string {
  if (!suffix?.trim()) return SMART_STORE_NAME;
  return `${suffix.trim()} | ${SMART_STORE_NAME}`;
}
