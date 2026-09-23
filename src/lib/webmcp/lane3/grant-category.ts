/**
 * GrantBot's own generator (`searchGrantListings`) is keyed by a category string
 * ("Nonprofit" | "Creator" | "Research" | "Small Business" | "Arts & Culture" — see
 * `src/app/api/grantbot/generate/route.ts`'s CATEGORIES list), but the WebMCP tool only
 * takes a free-text `discipline`. Map it to the closest category by keyword so the real
 * generator gets a valid category instead of an invented one; default matches the app's
 * own default ("Nonprofit").
 */
export function disciplineToCategory(discipline: string): string {
  const d = discipline.toLowerCase();
  if (/research|scien|lab|university|academic/.test(d)) return "Research";
  if (/business|startup|company|enterprise|commerce/.test(d)) return "Small Business";
  if (/art|music|film|culture|creative|craft|design/.test(d)) return "Arts & Culture";
  if (/creator|content|influencer|media|youtube|podcast/.test(d)) return "Creator";
  return "Nonprofit";
}

export function buildGrantOrgDescription(discipline: string): string {
  return `An organization or individual seeking funding in the "${discipline}" discipline/focus area. This request was submitted by an AI agent on behalf of the applicant via the GrantBot WebMCP tool; treat "${discipline}" as the applicant's primary focus and match grants accordingly.`;
}
