import "server-only";

import type { SourceProductDraft } from "@/lib/store/sources/types";

/** Temu adapter — returns [] until TEMU_API_KEY is configured. */
export async function searchTemuProducts(
  _query: string,
  _limit: number
): Promise<SourceProductDraft[]> {
  if (!process.env.TEMU_API_KEY?.trim()) return [];
  // Phase 2b: wire Temu partner API when credentials are available.
  return [];
}
