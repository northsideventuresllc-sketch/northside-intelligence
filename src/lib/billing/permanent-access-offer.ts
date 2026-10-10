/**
 * Deterministic "random" permanent-access offers for logged-in users.
 * Offers rotate weekly per user+tool so they feel random but are reproducible server-side.
 *
 * RETIRED 2026-10-09: lifetime/permanent-access purchases are no longer for sale.
 * Existing holders keep their access. This function now always returns false so
 * every pricing surface (toolkit page, tool pages, sector3 + grantbot pricing
 * sections) stops showing the "Buy Permanent Access" button.
 */

export function shouldShowPermanentAccessOffer(
  _toolSlug: string,
  _userId: string,
  _now: Date = new Date()
): boolean {
  // Lifetime sales retired — never show the permanent-access offer.
  return false;
}
