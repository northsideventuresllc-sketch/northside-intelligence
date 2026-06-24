const SITE_UPDATED_AT = process.env.NEXT_PUBLIC_SITE_UPDATED_AT;

function getSiteUpdatedDateValue(): Date {
  if (SITE_UPDATED_AT) {
    const parsed = new Date(SITE_UPDATED_AT);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

export function getSiteUpdatedDate(): string {
  return getSiteUpdatedDateValue().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
