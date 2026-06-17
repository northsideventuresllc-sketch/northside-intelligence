/**
 * Quick sanity check: CJ sellPrice range strings parse to listing high, then +10% retail.
 * Run: npx tsx scripts/verify-cj-pricing.ts
 */
import { calculateRetailPriceCents } from "../src/lib/store/pricing";
import { parseCjListingPriceUsd } from "../src/lib/store/sources/cj-pricing";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

const cases: Array<{ input: string; expectedUsd: number }> = [
  { input: "0.66 -- 3.54", expectedUsd: 3.54 },
  { input: "5.00 -- 9.99", expectedUsd: 9.99 },
  { input: "12.50", expectedUsd: 12.5 },
];

for (const { input, expectedUsd } of cases) {
  const parsed = parseCjListingPriceUsd(input);
  assert(parsed === expectedUsd, `${input} → ${parsed}, expected ${expectedUsd}`);
  const retail = calculateRetailPriceCents(Math.round(expectedUsd * 100));
  const expectedRetail = Math.round(expectedUsd * 100 * 1.1);
  assert(retail === expectedRetail, `retail for ${input}: ${retail} vs ${expectedRetail}`);
}

console.log("OK: CJ pricing parse + 10% markup verified.");
