export interface GrantListing {
  id: string;
  name: string;
  funder: string;
  platform: string;
  platformUrl: string;
  awardRange: string;
  fitReason: string;
  nextStep: string;
}

interface RawGrantListing {
  name?: unknown;
  funder?: unknown;
  platform?: unknown;
  platformUrl?: unknown;
  awardRange?: unknown;
  fitReason?: unknown;
  nextStep?: unknown;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeListing(raw: RawGrantListing, index: number): GrantListing | null {
  const name = asString(raw.name);
  const funder = asString(raw.funder);
  const platform = asString(raw.platform, "Official site");
  const platformUrl = asString(raw.platformUrl);
  const awardRange = asString(raw.awardRange, "Varies");
  const fitReason = asString(raw.fitReason);
  const nextStep = asString(raw.nextStep, "Review eligibility and prepare your narrative.");

  if (!name || !funder || !fitReason || !isValidUrl(platformUrl)) {
    return null;
  }

  return {
    id: `grant-${index}-${name.slice(0, 24).replace(/\s+/g, "-").toLowerCase()}`,
    name,
    funder,
    platform,
    platformUrl,
    awardRange,
    fitReason,
    nextStep,
  };
}

export function parseGrantListings(raw: unknown): GrantListing[] {
  let payload = raw;

  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*"grants"[\s\S]*\}/);
      if (!match) return [];
      try {
        payload = JSON.parse(match[0]);
      } catch {
        return [];
      }
    }
  }

  if (!payload || typeof payload !== "object" || !("grants" in payload)) {
    return [];
  }

  const grants = (payload as { grants: unknown }).grants;
  if (!Array.isArray(grants)) return [];

  return grants
    .map((entry, index) => normalizeListing(entry as RawGrantListing, index))
    .filter((entry): entry is GrantListing => entry !== null);
}

export function serializeGrantListings(grants: GrantListing[]): string {
  return JSON.stringify({ grants });
}
