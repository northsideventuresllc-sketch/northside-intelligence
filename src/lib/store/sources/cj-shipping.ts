const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
};

export interface ParsedCjShippingAddress {
  customerName: string;
  email: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  countryName: string;
}

export function parseCjShippingAddress(
  shipping: Record<string, unknown> | null,
  customerEmail: string | null
): ParsedCjShippingAddress | null {
  if (!shipping || typeof shipping !== "object") return null;

  const name = typeof shipping.name === "string" ? shipping.name.trim() : "";
  const address =
    shipping.address && typeof shipping.address === "object"
      ? (shipping.address as Record<string, unknown>)
      : null;
  if (!name || !address) return null;

  const line1 = typeof address.line1 === "string" ? address.line1.trim() : "";
  const city = typeof address.city === "string" ? address.city.trim() : "";
  const state = typeof address.state === "string" ? address.state.trim() : "";
  const postalCode =
    typeof address.postal_code === "string" ? address.postal_code.trim() : "";
  const countryCode =
    typeof address.country === "string" ? address.country.trim().toUpperCase() : "";

  if (!line1 || !city || !state || !postalCode || !countryCode) return null;

  const line2 = typeof address.line2 === "string" ? address.line2.trim() || null : null;
  const phone =
    typeof shipping.phone === "string" && shipping.phone.trim()
      ? shipping.phone.trim()
      : null;

  return {
    customerName: name,
    email: customerEmail,
    phone,
    line1,
    line2,
    city,
    state,
    postalCode,
    countryCode,
    countryName: COUNTRY_NAMES[countryCode] ?? countryCode,
  };
}
