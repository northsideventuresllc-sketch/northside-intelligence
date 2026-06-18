/** User-facing Smart Store product name (not internal ni_store_* table names). */
export const SMART_STORE_NAME = "Smart Store";

export function smartStorePageTitle(suffix?: string): string {
  if (!suffix?.trim()) return SMART_STORE_NAME;
  return `${suffix.trim()} | ${SMART_STORE_NAME}`;
}
