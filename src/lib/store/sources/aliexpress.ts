import "server-only";

import type { SourceProductDraft } from "@/lib/store/sources/types";

/** AliExpress adapter — returns [] until ALIEXPRESS_API_KEY is configured. */
export async function searchAliExpressProducts(
  _query: string,
  _limit: number
): Promise<SourceProductDraft[]> {
  if (!process.env.ALIEXPRESS_API_KEY?.trim()) return [];
  // Phase 2b: wire AliExpress Open Platform product search.
  return [];
}
