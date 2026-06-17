/**
 * Deterministic "random" permanent-access offers for logged-in users.
 * Offers rotate weekly per user+tool so they feel random but are reproducible server-side.
 */

const OFFER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const OFFER_ACTIVE_DAYS = 2;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function shouldShowPermanentAccessOffer(
  toolSlug: string,
  userId: string,
  now: Date = new Date()
): boolean {
  const weekIndex = Math.floor(now.getTime() / OFFER_WINDOW_MS);
  const seed = hashString(`${toolSlug}:${userId}:${weekIndex}`);
  const offerStartsOnDay = seed % 5;
  const dayInWeek = Math.floor((now.getTime() % OFFER_WINDOW_MS) / (24 * 60 * 60 * 1000));
  return dayInWeek >= offerStartsOnDay && dayInWeek < offerStartsOnDay + OFFER_ACTIVE_DAYS;
}
