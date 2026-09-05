/**
 * Regression check for NI-STORE-SHIP-OVERESTIMATE-0817: CJ leaves variantNameEn
 * blank for many single-SKU products. buildVariants() must fall back to
 * variantKey, then variantSku, then the product name -- never drop the variant.
 * Run: npx tsx scripts/verify-cj-variant-name-fallback.ts
 */
import { buildVariants } from "../src/lib/store/sources/cj-variants";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error("FAIL:", message);
    process.exit(1);
  }
}

// Blank variantNameEn, has variantKey -> falls back to variantKey.
const blankNameWithKey = buildVariants(
  [
    {
      vid: "cj-1992903820062793730",
      variantSku: "SKU-1",
      variantNameEn: "",
      variantKey: "Default",
      variantSellPrice: "12.50",
    },
  ],
  "A great product",
  "Great Product"
);
assert(blankNameWithKey.length === 1, "blank variantNameEn with variantKey dropped the variant entirely");
assert(
  blankNameWithKey[0]?.name === "Default",
  `expected fallback to variantKey "Default", got "${blankNameWithKey[0]?.name}"`
);

// Blank variantNameEn AND blank variantKey, has variantSku -> falls back to variantSku.
const blankNameAndKey = buildVariants(
  [
    {
      vid: "cj-2",
      variantSku: "SKU-2",
      variantNameEn: "  ",
      variantKey: "",
      variantSellPrice: "9.99",
    },
  ],
  "Another product",
  "Another Product"
);
assert(blankNameAndKey.length === 1, "blank variantNameEn and variantKey dropped the variant entirely");
assert(
  blankNameAndKey[0]?.name === "SKU-2",
  `expected fallback to variantSku "SKU-2", got "${blankNameAndKey[0]?.name}"`
);

// Everything blank -> falls back to the product name, still not dropped.
const allBlank = buildVariants(
  [
    {
      vid: "cj-3",
      variantSku: "",
      variantNameEn: "",
      variantKey: "",
      variantSellPrice: "5.00",
    },
  ],
  "Yet another product",
  "Fallback Product Name"
);
assert(allBlank.length === 1, "fully blank name fields dropped the variant entirely");
assert(
  allBlank[0]?.name === "Fallback Product Name",
  `expected fallback to product name "Fallback Product Name", got "${allBlank[0]?.name}"`
);

console.log("OK: CJ variant blank-name fallback (variantKey -> variantSku -> productName) verified.");
