import { formatStorePrice } from "@/lib/store/client";

/** Display single price or min–max range when CJ variants differ. */
export function formatRetailPriceRange(
  retailCents: number,
  minCents?: number | null,
  maxCents?: number | null,
  currency = "usd"
): string {
  const min = minCents ?? retailCents;
  const max = maxCents ?? retailCents;
  if (min !== max) {
    return `${formatStorePrice(min, currency)} – ${formatStorePrice(max, currency)}`;
  }
  return formatStorePrice(retailCents, currency);
}

export const STOCK_IMAGE_DISCLAIMER =
  "Representative image — may not match the exact CJ listing photo. Verify on the product page before ordering.";
