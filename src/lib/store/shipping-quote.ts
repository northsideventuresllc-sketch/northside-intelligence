import "server-only";

import type { ShippingTier } from "@/lib/store/cart/types";
import { expeditedShippingPremiumCents } from "@/lib/store/cart/types";
import type { CatalogProductRow } from "@/lib/store/catalog/products";
import { minimumShippingStipendCents } from "@/lib/store/economics";
import { estimateShippingCents } from "@/lib/store/pricing";
import { resolveCatalogLineSupplierCents } from "@/lib/store/catalog/line-price";
import {
  getCjFreightOptions,
  selectCjLogisticName,
} from "@/lib/store/sources/cj-orders";

export interface ShippingQuoteLine {
  catalog: CatalogProductRow;
  quantity: number;
  shippingTier: ShippingTier;
  variantId: string | null;
  unitRetailCents: number;
}

export interface ShippingQuoteResult {
  cjFreightCents: number | null;
  shippingStipendCents: number;
  shippingEstimateCents: number;
  hasExpedited: boolean;
  source: "cj" | "fallback";
}

/**
 * NI-STORE-SHIP-OVERESTIMATE-0817: the flat-rate fallback below is a
 * loss-prone placeholder ($5.99/$8.99/$12.99 by subtotal), meant only for the
 * rare case CJ freight can't be resolved. It fired silently on a real order -
 * this logs every fallback hit so it shows up in log monitoring instead of
 * disappearing into a normal-looking order. Logging only - no change to
 * return shape or checkout behavior.
 */
function logShippingFallback(reason: string, productRetailCents: number) {
  console.error(
    `[shipping-quote][FALLBACK_ALERT] reason=${reason} productRetailCents=${productRetailCents} - order will ship at flat-rate fallback pricing, not real CJ freight. Verify CJ freight API health and this order's economics reconciliation.`
  );
}

function aggregateSupplierAndRetail(lines: ShippingQuoteLine[]): {
  supplierCostCents: number;
  productRetailCents: number;
} {
  let supplierCostCents = 0;
  let productRetailCents = 0;
  for (const line of lines) {
    const supplier = resolveCatalogLineSupplierCents(line.catalog, line.variantId);
    supplierCostCents += supplier * line.quantity;
    productRetailCents += line.unitRetailCents * line.quantity;
  }
  return { supplierCostCents, productRetailCents };
}

export async function quoteCartShipping(
  lines: ShippingQuoteLine[],
  destinationCountryCode = "US"
): Promise<ShippingQuoteResult> {
  const hasExpedited = lines.some((line) => line.shippingTier === "expedited");
  const cjLines = lines
    .filter((line) => line.catalog.sourcePlatform === "cj" && line.variantId)
    .map((line) => ({
      variantId: line.variantId!,
      quantity: line.quantity,
      storeLineItemId: line.catalog.slug,
    }));

  const { supplierCostCents, productRetailCents } = aggregateSupplierAndRetail(lines);

  if (!cjLines.length) {
    logShippingFallback("no_cj_lines", productRetailCents);
    const fallback = estimateShippingCents(productRetailCents);
    const shippingStipendCents = hasExpedited
      ? fallback + expeditedShippingPremiumCents(fallback)
      : fallback;
    return {
      cjFreightCents: null,
      shippingStipendCents,
      shippingEstimateCents: fallback,
      hasExpedited,
      source: "fallback",
    };
  }

  try {
    const freightOptions = await getCjFreightOptions({
      destinationCountryCode,
      lines: cjLines,
    });
    const tier: ShippingTier = hasExpedited ? "expedited" : "standard";
    const logisticName = selectCjLogisticName(freightOptions, tier);
    const selected = freightOptions.find((row) => row.logisticName === logisticName);
    const cjFreightCents = selected
      ? Math.round(selected.logisticPrice * 100)
      : freightOptions.length
        ? Math.round(
            Math.min(...freightOptions.map((row) => row.logisticPrice)) * 100
          )
        : null;

    if (cjFreightCents == null) {
      logShippingFallback("cj_freight_empty", productRetailCents);
      const fallback = estimateShippingCents(productRetailCents);
      const shippingStipendCents = hasExpedited
        ? fallback + expeditedShippingPremiumCents(fallback)
        : fallback;
      return {
        cjFreightCents: null,
        shippingStipendCents,
        shippingEstimateCents: fallback,
        hasExpedited,
        source: "fallback",
      };
    }

    const expeditedPremiumCents = hasExpedited
      ? expeditedShippingPremiumCents(Math.ceil(cjFreightCents * 1.3))
      : 0;
    const shippingStipendCents = minimumShippingStipendCents({
      supplierCostCents,
      productRetailCents,
      cjFreightCents,
      expeditedPremiumCents,
    });

    return {
      cjFreightCents,
      shippingStipendCents,
      shippingEstimateCents: cjFreightCents,
      hasExpedited,
      source: "cj",
    };
  } catch (err) {
    console.warn("[store/shipping-quote] CJ freight failed, using fallback", err);
    logShippingFallback("cj_freight_error", productRetailCents);
    const fallback = estimateShippingCents(productRetailCents);
    const shippingStipendCents = hasExpedited
      ? fallback + expeditedShippingPremiumCents(fallback)
      : fallback;
    return {
      cjFreightCents: null,
      shippingStipendCents,
      shippingEstimateCents: fallback,
      hasExpedited,
      source: "fallback",
    };
  }
}
