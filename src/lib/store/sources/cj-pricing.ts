/**
 * Parse CJ list/query sellPrice strings such as "0.66 -- 3.54" or "2.81-44.15".
 * Uses the listing high when variant spread is normal; avoids MSRP outliers.
 */
export function parseCjListingPriceUsd(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map((n) => parseFloat(n)).filter((n) => Number.isFinite(n) && n > 0);
  if (!numbers?.length) return null;
  if (numbers.length === 1) return numbers[0];

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  if (max / min <= 8) return max;
  return min;
}

export function pickCjVariantSupplierUsd(
  variants: Array<{ variantSellPrice?: number | string }> | undefined
): number | null {
  if (!variants?.length) return null;
  const prices = variants
    .map((v) => Number(v.variantSellPrice))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (!prices.length) return null;

  const median = prices[Math.floor(prices.length / 2)];
  const filtered = prices.filter((p) => p <= median * 4);
  return Math.max(...filtered);
}

export function supplierCostCentsFromUsd(usd: number): number {
  return Math.round(usd * 100);
}
